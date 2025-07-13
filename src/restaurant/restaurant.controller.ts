// src/restaurant/restaurant.controller.ts

import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';

@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  /** GET /restaurants */
  @Get()
  async getAll() {
    return this.restaurantService.getAll();
  }

  /** GET /restaurants/:id */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const restaurant = await this.restaurantService.getById(+id);
    if (!restaurant) throw new NotFoundException(`Restaurant ${id} not found`);
    return restaurant;
  }

  /**
   * GET /restaurants/search?name=...&area=...
   * Returns one restaurant ID matching name+area
   */
  @Get('search')
  async searchByNameAndArea(
    @Query('name') name: string,
    @Query('area') area: string,
  ) {
    const id = await this.restaurantService.searchByNameAndArea(name, area);
    return { id };
  }

  /**
   * GET /restaurants/filter
   * Supports query params: cuisine, area, minRating, maxCost, vegOnly, dineInOnly
   */
  @Get('filter')
  async filterAdvanced(
    @Query('cuisine') cuisine?: string,
    @Query('area') area?: string,
    @Query('minRating') minRating?: string,
    @Query('maxCost') maxCost?: string,
    @Query('vegOnly') vegOnly?: string,
    @Query('dineInOnly') dineInOnly?: string,
  ) {
    const list = await this.restaurantService.filterAdvanced({
      cuisine,
      area,
      minRating: minRating ? +minRating : undefined,
      maxCost: maxCost ? +maxCost : undefined,
      vegOnly: vegOnly === 'true',
      dineInOnly: dineInOnly === 'true',
    });
    return list;
  }
}
