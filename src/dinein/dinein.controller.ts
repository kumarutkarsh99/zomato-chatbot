import { Controller, Post, Get, Param, Body, Patch } from '@nestjs/common';
import { DineinService } from './dinein.service';

@Controller('dinein')
export class DineinController {
  constructor(private readonly dineinService: DineinService) {}

  // 1. Book a table
  @Post('book')
  async bookTable(@Body() body: {
    user_id: number;
    restaurant_id: number;
    booking_date: string;
    booking_time: string;
    people_count: number;
  }) {
    return this.dineinService.bookTable(body);
  }

  // 2. Get bookings of a user
  @Get('user/:userId')
  async getUserBookings(@Param('userId') userId: number) {
    return this.dineinService.getUserBookings(userId);
  }

  // 3. Cancel a booking
  @Patch('cancel/:bookingId')
  async cancelBooking(@Param('bookingId') bookingId: number) {
    return this.dineinService.cancelBooking(bookingId);
  }

  // 4. Confirm a booking (admin)
  @Patch('confirm/:bookingId')
  async confirmBooking(@Param('bookingId') bookingId: number) {
    return this.dineinService.confirmBooking(bookingId);
  }

  // 5. Get all bookings (admin)
  @Get('all')
  async getAllBookings() {
    return this.dineinService.getAllBookings();
  }

  // 6. Get bookings for a restaurant (admin)
  @Get('restaurant/:restaurantId')
  async getRestaurantBookings(@Param('restaurantId') restaurantId: number) {
    return this.dineinService.getRestaurantBookings(restaurantId);
  }

  // 7. Get available time slots
  @Post('slots')
  async getAvailableTimeSlots(@Body() body: {
    restaurant_id: number;
    booking_date: string;
  }) {
    return this.dineinService.getAvailableTimeSlots(
      body.restaurant_id,
      body.booking_date,
    );
  }
}
