import { Controller, Get, Param, Query } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // 1. Get all restaurants
  @Get()
  getAll() {
    return this.restaurantService.getAll();
  }

  // 2. Get by ID
  @Get('id/:id')
  getById(@Param('id') id: number) {
    return this.restaurantService.getById(id);
  }

  // 3. Search by name
 @Get('search')
  searchByName(
    @Query('name') name: string,
    @Query('area') area: string
  ) {
    return this.restaurantService.searchByNameAndArea(name, area);
  }

  // 4. Filter by cuisine
  @Get('cuisine')
  filterByCuisine(@Query('type') cuisine: string) {
    return this.restaurantService.filterByCuisine(cuisine);
  }

  // 5. Filter by area
  @Get('area')
  filterByArea(@Query('name') area: string) {
    return this.restaurantService.filterByArea(area);
  }

  // 6. Home delivery available
  @Get('delivery')
  getDeliveryAvailable() {
    return this.restaurantService.getDeliveryAvailable();
  }

  // 7. Dine-in available
  @Get('dinein')
  getDineInAvailable() {
    return this.restaurantService.getDineInAvailable();
  }

  // 8. Vegetarian-only
  @Get('veg')
  getVegOnly() {
    return this.restaurantService.getVegOnly();
  }

  // 9. Top rated
  @Get('top-rated')
  getTopRated(@Query('limit') limit: number = 10) {
    return this.restaurantService.getTopRated(limit);
  }

  // 10. Most reviewed
  @Get('most-reviewed')
  getMostReviewed(@Query('limit') limit: number = 10) {
    return this.restaurantService.getMostReviewed(limit);
  }

  // 11. Sort by cost
  @Get('cost')
  getByCost(@Query('order') order: 'asc' | 'desc' = 'asc') {
    return this.restaurantService.getByCost(order);
  }

  // 12. Advanced filter
  @Get('filter')
  filterAdvanced(
    @Query('cuisine') cuisine?: string,
    @Query('area') area?: string,
    @Query('minRating') minRating?: number,
    @Query('maxCost') maxCost?: number,
    @Query('vegOnly') vegOnly?: boolean,
    @Query('dineInOnly') dineInOnly?: boolean,
  ) {
    return this.restaurantService.filterAdvanced({
      cuisine,
      area,
      minRating,
      maxCost,
      vegOnly,
      dineInOnly,
    });
  }
}
