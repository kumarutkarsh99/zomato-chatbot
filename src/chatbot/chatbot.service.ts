// src/chatbot/chatbot.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { MenusService } from '../menus/menus.service';
import { OrderService } from 'src/order/order.service';
import { DineinService } from 'src/dinein/dinein.service';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly menusService: MenusService,
    private readonly dineinService: DineinService,
  ) {}

  /** Dispatch incoming Dialogflow webhook to the right handler */
  async handleFulfillment(body: any) {
    const intent = body.queryResult.intent.displayName;
    const handler = this.handlers[intent] ?? this.handleNotSupported;
    return handler.call(this, body);
  }

  /** Map of intent names → methods */
  private handlers: Record<string, Function> = {
    'Default Welcome Intent': this.handleWelcome,
    'DineInIntent': this.handleDineIn,
    'RestaurantForDine': this.handleRestaurantForDine,
    'MenuForDine': this.handleMenuForDine,
    'RestaurantDetailsIntent': this.handleRestaurantDetails,
    'BookDineinIntent': this.handleBookDineinPrompt,
    'BookingConfirmationIntent': this.handleConfirmBookingDetails,
    'BookedIntent': this.handleDineInBooking,
  };

  private handleNotSupported() {
    return { fulfillmentText: 'Sorry, that intent is not supported.' };
  }

  /** Welcome message */
  private handleWelcome(body: any) {
    const session = body.session;
    return {
      fulfillmentText:
        'Welcome to Zomato Chatbot! Type "Delivery" or "Dine‑in" to continue.',
      outputContexts: [
        { name: `${session}/contexts/awaiting_user_choice`, lifespanCount: 5 },
      ],
    };
  }

  /** User chose dine‑in */
  private handleDineIn(body: any) {
    const session = body.session;
    return {
      fulfillmentText: 'Great! Which cuisine and location?',
      outputContexts: [
        { name: `${session}/contexts/dine_in_context`, lifespanCount: 5 },
      ],
    };
  }

  /** List restaurants matching cuisine+location */
  private async handleRestaurantForDine(body: any) {
    const session = body.session;
    const { cuisine = '', location = '' } = body.queryResult.parameters;

    const list = await this.restaurantService.filterAdvanced({
      cuisine,
      area: location,
      dineInOnly: true,
    });

    if (!list.length) {
      return { fulfillmentText: `No ${cuisine} restaurants found in ${location}.` };
    }

    const names = list.slice(0, 10).map(r => r.name).join(', ');
    return {
      fulfillmentText: `Here are some ${cuisine} restaurants in ${location}: ${names}. Which one?`,
      outputContexts: [
        {
          name: `${session}/contexts/dine_in_context`,
          lifespanCount: 5,
          parameters: { cuisine, location },
        },
      ],
    };
  }

  /** Show menu for the chosen restaurant */
  private async handleMenuForDine(body: any) {
    const session = body.session;
    const dineCtx = body.queryResult.outputContexts.find(ctx =>
      ctx.name.endsWith('/contexts/dine_in_context'),
    );

    const { cuisine, location, restaurantname } = dineCtx.parameters;
    const restaurantName = Array.isArray(restaurantname)
      ? restaurantname[0]
      : restaurantname;
    if (!restaurantName) {
      return { fulfillmentText: "Sorry, I didn't catch which restaurant." };
    }

    const restaurantId = await this.restaurantService.searchByNameAndArea(
      restaurantName,
      location,
    );
    const items = await this.menusService.getByRestaurantId(restaurantId);

    if (!items.length) {
      return { fulfillmentText: `No menu items found for ${restaurantName}.` };
    }

    const list = items.slice(0, 10).map((i, idx) => `${idx + 1}. ${i.item_name}`).join('\n');

    const parameters = {
      cuisine,
      location,
      restaurantname,
      restaurantId,
    };

    return {
      fulfillmentText: `Here are some items in ${restaurantName}:\n${list}.\nWould you like more details see more details about this restaurant?`,
      outputContexts: [
      {
        name: `${session}/contexts/dine_in_context`,
        lifespanCount: 5,
        parameters,
      },
      {
        name: `${session}/contexts/await_details_context`,
        lifespanCount: 1,
        parameters,
      },
    ],
    };
  }

   async handleRestaurantDetails(body: any) {
    const session = body.session;
    const dineCtx = body.queryResult.outputContexts.find(ctx =>
      ctx.name.endsWith('/contexts/await_details_context')
    );

    if (!dineCtx || !dineCtx.parameters.restaurantId) {
      return { fulfillmentText: "Sorry, I don't know which restaurant you mean." };
    }

    const { cuisine, location, restaurantname, restaurantId } = dineCtx.parameters;
    const restaurantName = Array.isArray(restaurantname) ? restaurantname[0] : restaurantname;

    let details;
    try {
      details = await this.restaurantService.getById(restaurantId);
    } catch (e) {
      return { fulfillmentText: `I couldn't find details for ${restaurantName}.` };
    }

    const {
      name,
      full_address,
      timing,
      is_indoor_seating,
      is_veg_only,
      dinner_rating,
      known_for, 
      popular_dishes,
      people_known_for,
      cuisines,
      average_cost,
    } = details;

    const speech = `
Here are the details for ${name}:
• Address: ${full_address}
• Hours: ${timing}
• ${is_indoor_seating ? 'Indoor Seating' : 'Outdoor Seating'}
• ${is_veg_only ? 'Veg' : 'Veg + Non-Veg'}
• Dinner Rating: ${dinner_rating}
• Known For: ${Array.isArray(known_for) ? known_for.join(', ') : known_for}
• Popular Dishes: ${Array.isArray(popular_dishes) ? popular_dishes.join(', ') : popular_dishes}
• Cuisines: ${Array.isArray(cuisines) ? cuisines.join(', ') : cuisines}
• Famous For: ${Array.isArray(people_known_for) ? people_known_for.join(', ') : people_known_for}
• Average cost: ${average_cost}.
Would you like to proceed with booking this restaurant?
    `.trim();

    return {
      fulfillmentText: speech,
      outputContexts: [
        {
          name: `${session}/contexts/await_booking_context`,
          lifespanCount: 5,
          parameters: { cuisine, location, restaurantname, restaurantId},
        },
        {
          name: `${session}/contexts/dine_in_context`,
          lifespanCount: 5,
          parameters: { cuisine, location, restaurantname, restaurantId },
        },
      ],
    };
  }

  async handleBookDineinPrompt(body: any) {
    const session = body.session;
    const ctx = body.queryResult.outputContexts.find(c =>
      c.name.endsWith('/contexts/await_booking_context'),
    );

    if (!ctx || !ctx.parameters.restaurantId) {
      return { fulfillmentText: "Sorry, I don't have enough information to proceed with booking." };
    }

    const { cuisine, location, restaurantname, restaurantId } = ctx.parameters;

    return {
      fulfillmentText: `Great! What time would you like to book the table, and for how many people?`,
      outputContexts: [
        {
          name: `${session}/contexts/await_booking_info`,
          lifespanCount: 2,
          parameters: { cuisine, location, restaurantname, restaurantId },
        },
      ],
    };
  }

async handleConfirmBookingDetails(body: any) {
  const session = body.session;
  const ctx = body.queryResult.outputContexts.find(c =>
    c.name.endsWith('/contexts/await_booking_info'),
  );

  if (!ctx || !ctx.parameters.restaurantId) {
    return { fulfillmentText: "Sorry, I couldn't confirm the restaurant info for your booking." };
  }

  const { cuisine, location, restaurantname, restaurantId } = ctx.parameters;
  const time = body.queryResult.parameters.time;
  const people = body.queryResult.parameters.people;

  if (!time || !people) {
    return {
      fulfillmentText: "I need both time and number of people to proceed with the booking.",
    };
  }

  return {
    fulfillmentText: `Please review the booking details:
• Restaurant: ${restaurantname}
• Location: ${location}
• Time: ${time}
• People: ${people}

Would you like to confirm the booking?`,
    outputContexts: [
      {
        name: `${session}/contexts/await_confirm_booking`,
        lifespanCount: 2,
        parameters: {
          cuisine,
          location,
          restaurantname,
          restaurantId,
          time,
          people,
        },
      },
    ],
  };
}

  async handleDineInBooking(body: any) {
    const session = body.session;
    const ctx = body.queryResult.outputContexts.find(c =>
      c.name.endsWith('/contexts/await_confirm_booking'),
    );

    if (!ctx || !ctx.parameters.restaurantId) {
      return {
        fulfillmentText: "Sorry, I couldn't confirm the restaurant info for your booking.",
      };
    }

    const {
      restaurantname,
      restaurantId,
      time,          
      people,
    } = ctx.parameters;

    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(Date.now() + istOffset);
    const booking_date = istDate.toISOString().split(' ')[0];

    const booking_time = time?.slice(0, 5);

    const booking = await this.dineinService.bookTable({
      user_id: 1, 
      restaurant_id: restaurantId,
      booking_date,
      booking_time,
      people_count: people,
    });

    const booking_id = booking.id || Math.floor(100000 + Math.random() * 900000); 

    return {
      fulfillmentText: `Booking confirmed!
      • Restaurant: ${restaurantname}
      • Time: ${booking_time}
      • People: ${people}
      • Booking ID: ${booking_id}

      Enjoy your meal!`,
          outputContexts: [],
    };
  }
}
