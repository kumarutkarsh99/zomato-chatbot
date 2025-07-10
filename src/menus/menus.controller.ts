import { Controller, Get, Param, Query, Post, Body, Patch } from '@nestjs/common';
import { MenusService } from './menus.service';

@Controller('menus')
export class MenusController {
  constructor(private readonly menuService: MenusService) {}

  // 1. Get all menus
  @Get()
  getAll() {
    return this.menuService.getAll();
  }

  // 2. Get by menu ID
  @Get('id/:id')
  getById(@Param('id') id: number) {
    return this.menuService.getById(id);
  }

  // 3. Get by restaurant ID
  @Get('restaurant/:restaurantId')
  getByRestaurantId(@Param('restaurantId') restaurantId: number) {
    return this.menuService.getByRestaurantId(restaurantId);
  }

  // 4. Veg and Non-Veg
  @Get('restaurant/:restaurantId/veg')
  getVegItems(@Param('restaurantId') restaurantId: number) {
    return this.menuService.getVegItems(restaurantId);
  }

  @Get('restaurant/:restaurantId/nonveg')
  getNonVegItems(@Param('restaurantId') restaurantId: number) {
    return this.menuService.getNonVegItems(restaurantId);
  }

  // 5. Filter by category
  @Get('restaurant/:restaurantId/category')
  getByCategory(
    @Param('restaurantId') restaurantId: number,
    @Query('name') category: string,
  ) {
    return this.menuService.getByCategory(restaurantId, category);
  }

  // 6. Search menu items by name
  @Get('restaurant/:restaurantId/search')
  searchItemsByName(
    @Param('restaurantId') restaurantId: number,
    @Query('keyword') keyword: string,
  ) {
    return this.menuService.searchItemsByName(restaurantId, keyword);
  }

  // 7. Filter by price range
  @Get('restaurant/:restaurantId/price-range')
  getItemsByPriceRange(
    @Param('restaurantId') restaurantId: number,
    @Query('min') min: number,
    @Query('max') max: number,
  ) {
    return this.menuService.getItemsByPriceRange(restaurantId, min, max);
  }

  // 8. Get all categories
  @Get('restaurant/:restaurantId/categories')
  getCategoriesByRestaurant(@Param('restaurantId') restaurantId: number) {
    return this.menuService.getCategoriesByRestaurant(restaurantId);
  }

  // 9. Add a new menu item (Admin)
  @Post('add')
  addMenuItem(@Body() body: {
    restaurant_id: number;
    item_name: string;
    price: number;
    is_veg: boolean;
    category: string;
  }) {
    return this.menuService.addMenuItem(body);
  }

  // 10. Update existing menu item (Admin)
  // @Patch('update/:id')
  // updateMenuItem(
  //   @Param('id') id: number,
  //   @Body() body: Partial<{
  //     item_name: string;
  //     price: number;
  //     is_veg: boolean;
  //     category: string;
  //   }>,
  // ) {
  //   return this.menuService.updateMenuItem(id, body);
  // }
}
