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
    private readonly orderService: OrderService
  ) {}

  async handleFulfillment(body: any) {
    const intent = body.queryResult.intent.displayName;
    const handler = this.handlers[intent] ?? this.handleNotSupported;
    return handler.call(this, body);
  }

  private handlers: Record<string, Function> = {
    'A - Default Welcome - context:  - awaiting_main_choice': this.handleWelcome,
    'A2 - DineIn - context: awaiting_main_choice - dine_in': this.handleDineIn,
    'A3 - RestaurantForDine - context: dine_in - dine_in': this.handleRestaurantForDine,
    'A4 - MenuForDine - context: dine_in - await_details': this.handleMenuForDine,
    'A5 - RestaurantDetails - context: await_details - await_details': this.handleRestaurantDetails,
    'A6 - BookDinein - context: await_details - await_details, await_booking_info': this.handleBookDineinPrompt,
    'A7 - BookingConfirm - context: await_booking_info - await_confirm_booking': this.handleConfirmBookingDetails,
    'A8 - Booked - context: await_confirm_booking -': this.handleDineInBooking,
    'C3 - track_response - context: order -': this.handleTrackOrder,
    'D3 - Dine_in_status - context : dine_in_id - dine_in_id': this.handleTrackDineinOrder,
    'B4 - ask_cuisine - context: cuisine - restaurant_selection': this.handleFindRestaurant,
    'B5 - select_restaurant - context: restaurant - dish': this.handleSelectDishes,
    'B6 - selecting_dish: dish - update': this.handleAddDish,
    'B7 - update_dishes - context: add - update': this.handleUpdateDishes,
    'B8 - remove_dishes - context: remove - update': this.handleRemoveDishes,
    'B9 - address - context: address - confirmation': this.handleAddressConfirmation,
    'B9 - confirm_order - context: confirm -': this.handleConfirmOrder,
    'E6 - Cancel Order Id - context : Order id - confirm': this.handleCancelOrderConfirm,
    'E7 Cancel DineIn - context : dinein Id - confirm': this.handleCancelDineInConfirm, 
    'E8 - Confirm_Cancel - context : confirm_cancel -': this.handleConfirmCancel
  };

  private handleNotSupported() {
    return { fulfillmentText: `Sorry, that intent is not supported. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`};
  }

  private handleWelcome(body: any) {
    const session = body.session;
    return {
      fulfillmentText:
        'Welcome to Zomato Chatbot! Type "Delivery", "Dine-in", "Track order/dine in" or "Cancel" to continue.',
      outputContexts: [
        { name: `${session}/contexts/awaiting_main_choice`, lifespanCount: 5 },
      ],
    };
  }

  private handleDineIn(body: any) {
    const session = body.session;
    return {
      fulfillmentText: 'Great! Which cuisine and location?',
      outputContexts: [
        { name: `${session}/contexts/dine_in`, lifespanCount: 2 },
      ],
    };
  }

  private async handleRestaurantForDine(body: any) {
    const session = body.session;
    const { cuisine = '', location = '' } = body.queryResult.parameters;

    const list = await this.restaurantService.filterAdvanced({
      cuisine,
      area: location,
      dineInOnly: true,
    });

    if (!list.length) {
      return { fulfillmentText: `No ${cuisine} restaurants found in ${location}. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]};
    }

    const names = list.slice(0, 10).map(r => r.name).join(', ');
    return {
      fulfillmentText: `Here are some ${cuisine} restaurants in ${location}: ${names}. Which one?`,
      outputContexts: [
        {
          name: `${session}/contexts/dine_in`,
          lifespanCount: 2,
          parameters: { cuisine, location },
        },
      ],
    };
  }

  private async handleMenuForDine(body: any) {
    const session = body.session;
    const dineCtx = body.queryResult.outputContexts.find(ctx =>
      ctx.name.endsWith('/contexts/dine_in'),
    );

    const { cuisine, location, restaurantname } = dineCtx.parameters;
    const restaurantName = Array.isArray(restaurantname)
      ? restaurantname[0]
      : restaurantname;
    if (!restaurantName) {
      return { fulfillmentText: `Sorry, I didn't catch which restaurant. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]};
    }

    const restaurantId = await this.restaurantService.searchByNameAndArea(
      restaurantName,
      location,
    );
    const items = await this.menusService.getByRestaurantId(restaurantId);

    if (!items.length) {
      return { fulfillmentText: `No menu items found for ${restaurantName}. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]};
    }

    const list = items.slice(0, 10).map((i, idx) => `${idx + 1}. ${i.item_name}`).join('\n');

    const parameters = {
      cuisine,
      location,
      restaurantname,
      restaurantId,
    };

    return {
      fulfillmentText: `Here are some items in ${restaurantName}:\n${list}.\nWould you like more details about this restaurant?`,
      outputContexts: [
      {
        name: `${session}/contexts/await_details`,
        lifespanCount: 1,
        parameters,
      },
    ],
    };
  }

   async handleRestaurantDetails(body: any) {
    const session = body.session;
    const dineCtx = body.queryResult.outputContexts.find(ctx =>
      ctx.name.endsWith('/contexts/await_details')
    );

    if (!dineCtx || !dineCtx.parameters.restaurantId) {
      return { fulfillmentText: `Sorry, I don't know which restaurant you mean. Type "Delivery", "Dine-in", "Track order/dine in" or "Cancel" to continue.`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]};
    }

    const { cuisine, location, restaurantname, restaurantId } = dineCtx.parameters;
    const restaurantName = Array.isArray(restaurantname) ? restaurantname[0] : restaurantname;

    let details;
    try {
      details = await this.restaurantService.getById(restaurantId);
    } catch (e) {
      return { fulfillmentText: `I couldn't find details for ${restaurantName}. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]};
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
          name: `${session}/contexts/await_book_details`,
          lifespanCount: 2,
          parameters: { cuisine, location, restaurantname, restaurantId},
        },
        {
          name: `${session}/contexts/awaiting_main_choice`,
          lifespanCount: 2,
        },
      ],
    };
  }

  async handleBookDineinPrompt(body: any) {
    const session = body.session;
    const ctx = body.queryResult.outputContexts.find(c =>
      c.name.endsWith('/contexts/await_book_details')
    );

    if (!ctx || !ctx.parameters.restaurantId) {
      return { fulfillmentText: `Sorry, I don't have enough information to proceed with booking. Type "Delivery", "Dine-in", "Track order/dine-in" or "Cancel" to continue.`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]};
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
    return { fulfillmentText: `Sorry, I couldn't confirm the restaurant info for your booking. Type "Delivery", "Dine-in", "Track order/dine-in" or "Cancel" to continue.`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
    }]};
  }

  const { cuisine, location, restaurantname, restaurantId } = ctx.parameters;
  const time = body.queryResult.parameters.time;
  const people = body.queryResult.parameters.people;

  if (!time || !people) {
    return {
      fulfillmentText: "I need both time and number of people to proceed with the booking.",
      outputContexts: [body.queryResult.outputContexts]
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
        lifespanCount: 1,
        parameters: {
          cuisine,
          location,
          restaurantname,
          restaurantId,
          time,
          people,
        },
      },
      {
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }
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
        fulfillmentText: `Sorry, I couldn't confirm the restaurant info for your booking. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]};
    }

    const { restaurantname, restaurantId, time, people } = ctx.parameters;

    function parseTimeInput(time: string): string {
  if (!time) return "00:00:00";

  // Case 1: ISO format (Dialogflow usually sends like 2025-08-16T19:30:00+05:30 or UTC Z)
  if (/^\d{4}-\d{2}-\d{2}T/.test(time)) {
    const d = new Date(time); // UTC-based JS date

    // Convert UTC → IST (+5h30m)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);

    const hours = istDate.getUTCHours().toString().padStart(2, "0");
    const minutes = istDate.getUTCMinutes().toString().padStart(2, "0");
    const seconds = istDate.getUTCSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }

  // Case 2: "7 pm" or "7:30 am"
  const match = time.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (match) {
    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const period = match[3];

    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;

    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
  }

  // Case 3: Already "HH:mm" or "HH:mm:ss" → assume IST input
  const hmMatch = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hmMatch) {
    const hours = hmMatch[1].padStart(2, "0");
    const minutes = hmMatch[2].padStart(2, "0");
    const seconds = hmMatch[3] || "00";
    return `${hours}:${minutes}:${seconds}`;
  }

  // Default fallback
  return "00:00:00";
}

    const booking_time = parseTimeInput(time);

    const now = new Date();
    const istOffset = 5.5 * 60; 
    const istDate = new Date(now.getTime() + istOffset * 60 * 1000);
    const booking_date = istDate.toISOString().split('T')[0]; 

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
      • Booking ID: ${booking_id}.
      Enjoy your meal! Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`,
      outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]
    };
  }

async handleTrackDineinOrder(body: any) {
  const session = body.session;
  try {
    const ctx = body.queryResult.outputContexts.find(c =>
      c.name.endsWith('/contexts/awaiting_dine_in_id'),
    );

    if (!ctx || !ctx.parameters.number) {
      return {
        fulfillmentText: `I couldn't find your dine In ID. Can you provide it again?`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_dine_in_id`,
        lifespanCount: 1,
      }]};
    }

    const { number } = ctx.parameters;
    const booking = await this.dineinService.getBookingById(number);
    if (!booking) {
      return { 
        fulfillmentText: `Booking #${number} not found. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]};
    }

    const { restaurant_id, booking_time, people_count, status } = booking;

    const restaurant = await this.restaurantService.getById(restaurant_id);
    const restaurantName = restaurant?.name || 'Unknown';

    return {
      fulfillmentText: status == null
        ? `Booking #${number} not found.`
        : `Booking #${number} info: Restaurant: ${restaurantName} Time: ${booking_time} People: ${people_count} Status: ${status}. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`,
      outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]
    };
  } catch (err) {
    console.error('Error in handleTrackDineinOrder:', err);
    return { fulfillmentText: 'Sorry, I could not retrieve your booking. Please try again with your booking Id.',
      outputContexts: [{
        name: `${session}/contexts/awaiting_dine_in_id`,
        lifespanCount: 1,
      }]
     };
  }
}

async handleTrackOrder(body: any) {
  const session = body.session;
  try {
    const ctx = body.queryResult.outputContexts.find(c =>
      c.name.endsWith('/contexts/awaiting_order_id'),
    );

    if (!ctx || !ctx.parameters.number) {
      return {
        fulfillmentText: `I couldn't find your order ID. Can you provide it again?`,
        outputContexts: [{
        name: `${session}/contexts/awaiting_order_id`,
        lifespanCount: 1,
      }]};
    }

    const { number: orderId } = ctx.parameters;
    const order = await this.orderService.trackOrder(orderId);

    if (!order) {
      return { fulfillmentText: `Order #${orderId} not found. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
      outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }] };
    }

    const { totalAmount, restaurantId, items, status } = order;

    const restaurant = await this.restaurantService.getById(restaurantId);
    const restaurantName = restaurant?.name || 'Unknown';

    const itemsText = items
      .map(i => `- ${i.name} x${i.quantity} (₹${i.price})`)
      .join('\n');

    const fulfillmentText = `Here is the summary for your order #${orderId} from ${restaurantName}:\n\n` +
      `Status: ${status}\n` +
      `Total Amount: ₹${totalAmount}\n` +
      `Items:\n${itemsText}. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`;

    return {
      fulfillmentText,
      outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]
    };
  } catch (err) {
    console.error('Error in handleTrackOrder:', err);
    return { 
      fulfillmentText: 'Sorry, I could not retrieve your order. Please try again with your Order Id.', 
      outputContexts: [{
        name: `${session}/contexts/awaiting_order_id`,
        lifespanCount: 1,
      }] 
    };
  }
}

private async handleFindRestaurant(body: any) {
  const session = body.session;

  const cuisine = body.queryResult.parameters?.cuisine || '';
  let location = body.queryResult.parameters?.location || '';
  if (!location) {
    const locationCtx = body.queryResult.outputContexts.find(ctx =>
      ctx.parameters?.location
    );
    location = locationCtx?.parameters?.location || '';
  }

  const list = await this.restaurantService.filterAdvanced({
      cuisine,
      area: location,
      homeDelivery: true,
  });

    if (!list.length) {
      return { fulfillmentText: `No ${cuisine} restaurants found in ${location}. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
      outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
      }]};
    }

    const names = list.slice(0, 10).map(r => r.name).join(', ');

  return {
    fulfillmentText: `Here are some ${cuisine} restaurants in ${location}: ${names}. Which one?`,
    outputContexts: [
      {
        name: `${session}/contexts/awaiting_restaurant_selection`,
        lifespanCount: 2,
        parameters: { cuisine, location },
      },
    ],
  };
}

private async handleSelectDishes(body: any) {
  const session = body.session;

  const restaurantArr = body.queryResult.parameters?.restaurantname || [];
  const restaurantName = Array.isArray(restaurantArr) ? restaurantArr[0] : restaurantArr;

  const prevCtx = body.queryResult.outputContexts.find(ctx =>
    ctx.name.endsWith('/contexts/awaiting_restaurant_selection')
  );

  const { cuisine = '', location = '' } = prevCtx?.parameters || {};

  const restaurantId = await this.restaurantService.searchByNameAndArea(restaurantName, location);
  const items = await this.menusService.getByRestaurantId(restaurantId);

  if (!items.length) {
    return { fulfillmentText: `No menu items found for ${restaurantName}. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
      outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }] };
  }

  const list = items.slice(0, 10).map((i, idx) => `${idx + 1}. ${i.item_name}`).join('\n');

  return {
    fulfillmentText: `Here are some items in ${restaurantName}:\n${list}.\nWhich items would you like to proceed with? Please enter dishes and quantity.`,
    outputContexts: [
      {
        name: `${session}/contexts/awaiting_dish_selection`,
        lifespanCount: 1,
        parameters: { cuisine, location, restaurantName, restaurantId },
      },
    ],
  };
}

private async handleAddDish(body: any) {
  const session = body.session;

  const dishNames: string[] = Array.isArray(body.queryResult.parameters?.dishname)
    ? body.queryResult.parameters.dishname
    : [body.queryResult.parameters?.dishname || ''];

  const quantities: number[] = Array.isArray(body.queryResult.parameters?.number)
    ? body.queryResult.parameters.number
    : [body.queryResult.parameters?.number || 1];

  const dishCtx = body.queryResult.outputContexts.find(ctx =>
    ctx.name.endsWith('/contexts/awaiting_dish_selection')
  );

  const {
    cuisine = '',
    location = '',
    restaurantName = '',
    restaurantId = '',
    dishes = []
  } = dishCtx?.parameters || {};

  const updatedDishes = Array.isArray(dishes) ? [...dishes] : [];

  dishNames.forEach((dish, idx) => {
    const qty = quantities[idx] || 1;

    const existingIndex = updatedDishes.findIndex(
      d => d.dishName.toLowerCase() === dish.toLowerCase()
    );
    if (existingIndex >= 0) {
      updatedDishes[existingIndex].quantity += qty;
    } else {
      updatedDishes.push({ dishName: dish, quantity: qty });
    }
  });

  const addedList = dishNames
    .map((dish, idx) => `${quantities[idx] || 1} x ${dish}`)
    .join(', ');

  const cartList = updatedDishes
    .map(d => `${d.quantity} x ${d.dishName}`)
    .join(', ');

  return {
    fulfillmentText: `Added ${addedList} to your order. Your cart has: ${cartList}. Anything else? If no, please provide your address.`,
    outputContexts: [
      {
        name: `${session}/contexts/awaiting_dish_selection`,
        lifespanCount: 1,
        parameters: {
          cuisine,
          location,
          restaurantName,
          restaurantId,
          dishes: updatedDishes
        },
      },
    ],
  };
}

private async handleUpdateDishes(body: any) {
  const session = body.session;

  const qtyToAdd = body.queryResult.parameters?.number?.[0] || 0;
  const dishName = body.queryResult.parameters?.dishname?.[0] || '';

  const dishCtx = body.queryResult.outputContexts.find(ctx =>
    ctx.name.endsWith('/contexts/awaiting_dish_selection')
  );

  if (!dishCtx) {
    return { fulfillmentText: "I couldn't find your current order to update. Please add/remove dishes or provide address.",
      outputContexts: [body.queryResult.outputContexts]
    };
  }

  let dishes = dishCtx.parameters?.dishes || [];

  const dishIndex = dishes.findIndex(
    d => d.dishName.toLowerCase() === dishName.toLowerCase()
  );

  if (dishIndex !== -1) {
    dishes[dishIndex].quantity += qtyToAdd;
  } else {
    dishes.push({ dishName, quantity: qtyToAdd });
  }

  dishes = dishes.filter(d => d.quantity > 0);

  const cartSummary = dishes
    .map(d => `${d.quantity} × ${d.dishName}`)
    .join(', ');

  return {
    fulfillmentText: `Got it! I've updated your cart: ${cartSummary}. Do you want to modify your order? If no, Please provide your address`,
    outputContexts: [
      {
        name: `${session}/contexts/awaiting_dish_selection`,
        lifespanCount: 1,
        parameters: {
          ...dishCtx.parameters,
          dishes
        }
      }
    ]
  };
}

private async handleRemoveDishes(body: any) {
  const session = body.session;

  const dishName = body.queryResult.parameters?.dishname || '';
  const removeQty = Number(body.queryResult.parameters?.number) || null;

  if (!dishName) {
    return { fulfillmentText: `I couldn't find the dish you want to remove. Please add/remove items or provide address.`,
      outputContexts: [body.queryResult.outputContexts] 
    };
  }

  const dishCtx = body.queryResult.outputContexts.find(ctx =>
    ctx.name.endsWith('/contexts/awaiting_dish_selection')
  );

  if (!dishCtx) {
    return { 
      fulfillmentText: `I couldn't find your current order to update. Type "Delivery", "Dine-in", "Track Order/Dine-in" or "Cancel" to continue.`,
      outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }]};
  }

  let dishes = [...(dishCtx.parameters?.dishes || [])];

  const index = dishes.findIndex(
    d => d.dishName.toLowerCase() === dishName.toLowerCase()
  );

  if (index === -1) {
    return { 
      fulfillmentText: `You don't have ${dishName} in your cart. Do you want to modify your order? If no, Please provide your address`,
      outputContexts: [
      {
        name: `${session}/contexts/awaiting_dish_selection`,
        lifespanCount: 1,
        parameters: {
          ...dishCtx.parameters,
          dishes
        }
      }
    ]};
  }

  if (removeQty && removeQty < dishes[index].quantity) {
    dishes[index].quantity -= removeQty;
  } else {
    dishes.splice(index, 1);
  }

  const cartSummary = dishes.length
    ? `Your cart now has: ${dishes.map(d => `${d.quantity} × ${d.dishName}`).join(', ')}.`
    : 'Your cart is now empty.';

  return {
    fulfillmentText: `Removed ${removeQty || 'all'} ${dishName} from your cart. ${cartSummary}. Do you want to modify your order? If no, Please provide your address`,
    outputContexts: [
      {
        name: `${session}/contexts/awaiting_dish_selection`,
        lifespanCount: 1,
        parameters: {
          ...dishCtx.parameters,
          dishes
        }
      }
    ]
  };
}

private async handleAddressConfirmation(body: any) {
  const session = body.session;

  const address = body.queryResult.parameters?.Address ||
    body.queryResult.outputContexts.find(ctx =>
      ctx.name.endsWith('/contexts/awaiting_dish_selection')
    )?.parameters?.Address || '';

  const dishCtx = body.queryResult.outputContexts.find(ctx =>
    ctx.name.endsWith('/contexts/awaiting_dish_selection')
  );

  const dishes = dishCtx?.parameters?.dishes || [];
  const restaurantName = dishCtx?.parameters?.restaurantName || '';
  const cuisine = dishCtx?.parameters?.cuisine || '';
  const location = dishCtx?.parameters?.location || '';

  if (!dishes.length) {
    return {
      fulfillmentText: `I couldn't find any items in your order to confirm. Type "Delivery", "Dine-in", "Track Order/Dine-in" or "Cancel" to continue.`,
      outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }]};
  }

  const orderList = dishes.map(d => `${d.quantity} × ${d.dishName}`).join(', ');

  const confirmationMessage =
    `Here is your order summary:\n` +
    `Restaurant: ${restaurantName} (${cuisine}, ${location})\n` +
    `Items: ${orderList}\n` +
    `Delivery Address: ${address}\n\n` +
    `Do you want me to place this order?`;

  return {
    fulfillmentText: confirmationMessage,
    outputContexts: [
      {
        name: `${session}/contexts/awaiting_confirm_order`,
        lifespanCount: 1,
        parameters: {
          ...dishCtx.parameters,
          Address: address
        }
      },
       {
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }
    ]
  };
}

private async handleConfirmOrder(body: any) {
  const session = body.session;

  const confirmCtx = body.queryResult.outputContexts.find(ctx =>
    ctx.name.endsWith('/contexts/awaiting_confirm_order')
  );

  if (!confirmCtx) {
    return {
      fulfillmentText: `I couldn't find any order details to confirm. Type "Delivery", "Dine-in", "Track Order/Dine-in" or "Cancel" to continue.`,
      outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }]};
  }

  const {
    restaurantId,
    restaurantName,
    cuisine,
    location,
    dishes = [],
    Address
  } = confirmCtx.parameters;

  if (!restaurantId || dishes.length === 0) {
    return {
      fulfillmentText: `I couldn't find the restaurant or dishes to place your order. Type "Delivery", "Dine-in", "Track Order/Dine-in" or "Cancel" to continue.`,
      outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }]};
  }

  const items = dishes.map((d: any) => ({
    dishname: d.dishName,
    quantity: d.quantity
  }));

  const { orderId, totalPrice } = await this.orderService.placeOrder(
    1, 
    restaurantId,
    items
  );

  const orderList = dishes
    .map((d: any) => `${d.quantity} × ${d.dishName}`)
    .join(', ');

  const placedMessage =
    `Your order (ID: ${orderId}) has been placed!\n\n` +
    `Restaurant: ${restaurantName} (${cuisine}, ${location})\n` +
    `Items: ${orderList}\n` +
    `Total: ₹${totalPrice}\n` +
    `Delivery Address: ${Address}\n\n` +
    `Thank you for ordering with us! Type "Delivery", "Dine-in", "Track order/dine in" or "Cancel" to continue.`;

  return {
    fulfillmentText: placedMessage,
    outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }, 
    {
      name: `${session}/contexts/awaiting_location`,
      lifespanCount: 1,
    }
    ]
  };
}

async handleCancelOrderConfirm(body: any) {
  const session = body.session;

  const cancelCtx = body.queryResult.outputContexts.find(ctx =>
    ctx.name.endsWith('/contexts/awaiting_cancel_order_id')
  );

  if (!cancelCtx || !cancelCtx.parameters.number) {
    return { fulfillmentText: "Sorry, I didn't get the order ID to cancel. Please try again with your Order ID.",
      outputContexts: [{
      name: `${session}/contexts/awaiting_cancel_order_id`,
      lifespanCount: 1,
    }]};
  }

  const orderId = cancelCtx.parameters.number;

  const order = await this.orderService.trackOrder(orderId);

    if (!order) {
      return { 
        fulfillmentText: `Order #${orderId} not found. Type "Delivery", "Dine-in", "Track Order/Dine-in" or "Cancel" to continue.`,
        outputContexts: [{
        name: `${session}/contexts/awaiting_main_choice`,
        lifespanCount: 1,
      }]};
    }

    const { totalAmount, restaurantId, items, status } = order;

    const restaurant = await this.restaurantService.getById(restaurantId);
    const restaurantName = restaurant?.name || 'Unknown';

    const itemsText = items
      .map(i => `- ${i.name} x${i.quantity} (₹${i.price})`)
      .join('\n');

  const updatedContext = {
    name: `${session}/contexts/awaiting_confirm_cancel`,
    lifespanCount: 1,
    parameters: {
      ...cancelCtx.parameters,
      orderId,
    },
  };

  return {
    fulfillmentText: `Here is the summary for your order #${orderId} from ${restaurantName}:\n\n` +
      `Status: ${status}\n` +
      `Total Amount: ₹${totalAmount}\n` +
      `Items:\n${itemsText}. Are you sure you want to cancel your order ${orderId}?`,
    outputContexts: [updatedContext],
  };
}

async handleCancelDineInConfirm(body: any) {
  const session = body.session;

  const cancelCtx = body.queryResult.outputContexts.find(ctx =>
    ctx.name.endsWith('/contexts/awaiting_cancel_dinein_id')
  );

  if (!cancelCtx || !cancelCtx.parameters.number) {
    return { fulfillmentText: "Sorry, I didn't get the DineIn ID to cancel. Please try again with your DineIn ID.", 
      outputContexts: [{
      name: `${session}/contexts/awaiting_cancel_dinein_id`,
      lifespanCount: 1,
    }]};
  }

  const dineinId = cancelCtx.parameters.number;
  const booking = await this.dineinService.getBookingById(dineinId);
    if (!booking) {
      return { fulfillmentText: `Booking #${dineinId} not found. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
       outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }]};
    }

    const { restaurant_id, booking_time, people_count, status } = booking;

    const restaurant = await this.restaurantService.getById(restaurant_id);
    const restaurantName = restaurant?.name || 'Unknown';

  const updatedContext = {
    name: `${session}/contexts/awaiting_confirm_cancel`,
    lifespanCount: 1,
    parameters: {
      ...cancelCtx.parameters,
      dineinId,
    },
  };

  return {
    fulfillmentText: `Booking #${dineinId} info: Restaurant: ${restaurantName} Time: ${booking_time} People: ${people_count} Status: ${status}. Are you sure you want to cancel your Dine In booking ${dineinId}?`,
    outputContexts: [updatedContext],
  };
}

async handleConfirmCancel(body: any) {
  const session = body.session;

  const confirmCtx = body.queryResult.outputContexts.find(ctx =>
    ctx.name.endsWith('/contexts/awaiting_confirm_cancel')
  );

  if (!confirmCtx) {
    return { fulfillmentText: `Sorry, I couldn't find the confirmation context. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`,
      outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }]};
  }

  const { dineinId, orderId } = confirmCtx.parameters ?? {};

  if (!dineinId && !orderId) {
    return { fulfillmentText: `Your cancellation request has been processed successfully. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`, 
      outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }]};
  }

  let resultMessage = '';

  try {
    if (orderId) {
      await this.orderService.cancelOrder(orderId);
      resultMessage += `Order ${orderId} has been successfully cancelled. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`;
    }
    if (dineinId) {
      await this.dineinService.cancelBooking(dineinId);
      resultMessage += `Dine-in booking ${dineinId} has been successfully cancelled. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.`;
    }
  } catch (err) {
    console.error('Error cancelling:', err);
    resultMessage = 'There was an error completing the cancellation. Type "Delivery", "Dine‑in", "Track order/dine in" or "Cancel" to continue.';
  }

  return {
    fulfillmentText: resultMessage,
    outputContexts: [{
      name: `${session}/contexts/awaiting_main_choice`,
      lifespanCount: 1,
    }]
  };
}

}
