import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
} from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // 1. Place new order
  @Post()
  placeOrder(
    @Body()
    body: {
      user_id: number;
      restaurant_id: number;
      items: { menu_id: number; quantity: number }[];
    },
  ) {
    return this.orderService.placeOrder(body.user_id, body.restaurant_id, body.items);
  }

  // 2. Track order by ID
  @Get(':id')
  trackOrder(@Param('id') id: number) {
    return this.orderService.trackOrder(id);
  }

  // 3. Cancel order
  @Patch('cancel/:id')
  cancelOrder(@Param('id') id: number) {
    return this.orderService.cancelOrder(id);
  }

  // 4. Update status (admin use)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: number,
    @Body() body: { newStatus: string },
  ) {
    return this.orderService.updateStatus(id, body.newStatus);
  }

  // 5. Orders by user
  @Get('user/:userId')
  getUserOrders(@Param('userId') userId: number) {
    return this.orderService.getOrdersByUser(userId);
  }

  // 6. Orders by restaurant
  @Get('restaurant/:restaurantId')
  getRestaurantOrders(@Param('restaurantId') restaurantId: number) {
    return this.orderService.getOrdersByRestaurant(restaurantId);
  }

  // 7. Sales summary
  @Get('restaurant/:restaurantId/summary')
  getSummary(@Param('restaurantId') restaurantId: number) {
    return this.orderService.getSalesSummary(restaurantId);
  }
}
