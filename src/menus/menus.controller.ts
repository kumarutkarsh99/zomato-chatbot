// src/menus/menus.controller.ts

import { Controller, Get, Param, Query, NotFoundException, Post, Body } from '@nestjs/common';
import { MenusService } from './menus.service';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  /** GET /menus */
  @Get()
  async getAll() {
    return this.menusService.getAll();
  }

  /** GET /menus/:id */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.menusService.getById(+id);
  }

  /** GET /menus/restaurant/:rid */
  @Get('restaurant/:rid')
  async getByRestaurantId(@Param('rid') rid: string) {
    return this.menusService.getByRestaurantId(+rid);
  }

  /** GET /menus/restaurant/:rid/category?category=... */
  @Get('restaurant/:rid/category')
  async getByCategory(
    @Param('rid') rid: string,
    @Query('category') category: string,
  ) {
    return this.menusService.getByCategory(+rid, category);
  }

  /** GET /menus/restaurant/:rid/search?keyword=... */
  @Get('restaurant/:rid/search')
  async searchItemsByName(
    @Param('rid') rid: string,
    @Query('keyword') keyword: string,
  ) {
    return this.menusService.searchItemsByName(+rid, keyword);
  }

  /** GET /menus/restaurant/:rid/price?min=0&max=100 */
  @Get('restaurant/:rid/price')
  async getByPriceRange(
    @Param('rid') rid: string,
    @Query('min') min: string,
    @Query('max') max: string,
  ) {
    return this.menusService.getItemsByPriceRange(+rid, +min, +max);
  }

  /** GET /menus/restaurant/:rid/categories */
  @Get('restaurant/:rid/categories')
  async getCategories(@Param('rid') rid: string) {
    return this.menusService.getCategoriesByRestaurant(+rid);
  }

  /** POST /menus */
  @Post()
  async addMenuItem(
    @Body()
    data: {
      restaurant_id: number;
      item_name: string;
      price: number;
      is_veg: boolean;
      category: string;
    },
  ) {
    return this.menusService.addMenuItem(data);
  }
}
