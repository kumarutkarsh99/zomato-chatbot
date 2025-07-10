import { Injectable } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';
import { MenusService } from 'src/menus/menus.service';

@Injectable()
export class ChatbotService {
  constructor(private restaurantService: RestaurantService, private menusService: MenusService) {}

  async handleFulfillment(body: any) {
    console.log('Received body from Dialogflow:', JSON.stringify(body, null, 2));
    const intent = body.queryResult.intent.displayName;

    if (intent === 'SearchRestaurantsIntent') {
      return this.handleSearchRestaurant(body);
    }
    if (intent === 'ViewMenuIntent'){
      return this.handleViewMenu(body);
    }

    return { fulfillmentText: 'Intent not supported.' };
  }

  async handleSearchRestaurant(body: any) {
    const params = body.queryResult.parameters;
    const area = params.Location;
    const cuisine = params.Cuisine; 

    const results = await this.restaurantService.filterAdvanced({
      cuisine,
      area,
    });

    if (results.rows.length === 0) {
      return {
        fulfillmentText: `No ${cuisine} restaurants found in ${area}.`,
      };
    }

    const names = results.rows.slice(0, 10).map(r => r.name).join(', ');
    return {
      fulfillmentText: `Here are some ${cuisine} restaurants in ${area}: ${names}. Which one?`,
      outputContexts: [
        {
          name: `${body.session}/contexts/awaiting_restaurant`,
          lifespanCount: 5,
          parameters: {
            cuisine,
            area,
          }
        }
      ]
    };
  }

  async handleViewMenu(body: any) {
  const ctx = body.queryResult.outputContexts.find(c =>
    c.name.endsWith('/contexts/awaiting_restaurant')
  );

  if (!ctx) {
    return { fulfillmentText: "Sorry, I couldn't determine which restaurant to look up." };
  }

  const cuisine: string = ctx.parameters.cuisine;
  const area: string = ctx.parameters.area;
  // Note: parameter key is "RestaurantName" (capital R & N)
  const restaurantName: string = body.queryResult.parameters.RestaurantName;

  if (!restaurantName) {
    return { fulfillmentText: "Sorry, I didn't catch which restaurant you meant." };
  }

  const restaurantId: number = await this.restaurantService.searchByNameAndArea(
    restaurantName,
    area
  );

  const results = await this.menusService.getByRestaurantId(restaurantId);

  if (!results.rows.length) {
    return {
      fulfillmentText: `No ${cuisine} menu items found for ${restaurantName}.`
    };
  }

  const itemsList = results.rows
    .slice(0, 10)
    .map((r, i) => `${i + 1}. ${r.item_name}`)
    .join('\n');

  const fulfillmentText = [
    `Here are some items in ${restaurantName}'s menu:`,
    itemsList,
    `Which items would you like to proceed with?`
  ].join('\n');

  return {
    fulfillmentText,
    outputContexts: [
      {
        name: `${body.session}/contexts/awaiting_menu_selection`,
        lifespanCount: 5,
        parameters: {
          restaurantName,
          cuisine,
          area
        }
      }
    ]
  };
}


}
