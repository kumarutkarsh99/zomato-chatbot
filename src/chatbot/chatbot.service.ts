import { Injectable } from '@nestjs/common';
import { RestaurantService } from '../restaurant/restaurant.service';

@Injectable()
export class ChatbotService {
  constructor(private restaurantService: RestaurantService) {}

  async handleFulfillment(body: any) {
    console.log('Received body from Dialogflow:', JSON.stringify(body, null, 2));
    const intent = body.queryResult.intent.displayName;

    if (intent === 'SearchRestaurantsIntent') {
      return this.handleSearchRestaurant(body);
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
      fulfillmentText: `Here are some ${cuisine} restaurants in ${area}: ${names}`,
    };
  }
}
