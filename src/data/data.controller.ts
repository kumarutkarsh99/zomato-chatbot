import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { DataService } from './data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  // --- Restaurants ---

  @Post('restaurant')
  async insertRestaurant(@Body() body: any) {
    return this.dataService.insertRestaurant(body);
  }

  @Put('restaurant/:id')
  async updateRestaurant(@Param('id') id: number, @Body() body: any) {
    return this.dataService.updateRestaurant(Number(id), body);
  }

  @Delete('restaurant/:id')
  async deleteRestaurant(@Param('id') id: number) {
    return this.dataService.deleteRestaurant(Number(id));
  }

  @Post('restaurants/bulk')
  async bulkInsertRestaurants(@Body() body: any[]) {
    return this.dataService.bulkInsertRestaurants(body);
  }

  // --- Menus ---

  @Post('restaurant/:id/menus')
  async insertMenus(@Param('id') restaurantId: number, @Body() body: any[]) {
    return this.dataService.insertMenus(Number(restaurantId), body);
  }

  @Get('restaurant/:id/menus')
  async getMenusByRestaurant(@Param('id') restaurantId: number) {
    return this.dataService.getMenusByRestaurant(Number(restaurantId));
  }

  @Delete('restaurant/:id/menus')
  async deleteMenusByRestaurant(@Param('id') restaurantId: number) {
    return this.dataService.deleteMenusByRestaurant(Number(restaurantId));
  }

  // --- Admin utilities ---

  @Delete('truncate-all')
  async truncateAll() {
    return this.dataService.truncateAll();
  }
}
