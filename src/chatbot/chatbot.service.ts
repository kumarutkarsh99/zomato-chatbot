// src/chatbot/chatbot.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { MenusService } from '../menus/menus.service';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly menusService: MenusService,
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
    return {
      fulfillmentText: `Here are some items in ${restaurantName}:\n${list}\nWhat would you like?`,
      outputContexts: [
        {
          name: `${session}/contexts/dine_in_context`,
          lifespanCount: 5,
          parameters: { cuisine, location, restaurantname, restaurantId },
        },
      ],
    };
  }
}
