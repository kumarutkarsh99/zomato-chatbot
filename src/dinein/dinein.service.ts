import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DineinService {
  constructor(private db: DatabaseService) {}

  /**
   * 1. Book a table
   */
  async bookTable(data: {
    user_id: number;
    restaurant_id: number;
    booking_date: string; // 'YYYY-MM-DD'
    booking_time: string; // 'HH:MM'
    people_count: number;
  }) {
    const query = `
      INSERT INTO dinein_bookings 
      (user_id, restaurant_id, booking_date, booking_time, people_count) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`;
    const values = [
      data.user_id,
      data.restaurant_id,
      data.booking_date,
      data.booking_time,
      data.people_count,
    ];
    return this.db.query(query, values);
  }

  /**
   * 2. View bookings for a user
   */
  async getUserBookings(userId: number) {
    return this.db.query(
      `SELECT b.*, r.name AS restaurant_name 
       FROM dinein_bookings b
       JOIN restaurants r ON r.id = b.restaurant_id
       WHERE b.user_id = $1 
       ORDER BY booking_date DESC, booking_time DESC`,
      [userId],
    );
  }

  /**
   * 3. Cancel a booking
   */
  async cancelBooking(bookingId: number) {
    return this.db.query(
      `UPDATE dinein_bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [bookingId],
    );
  }

  /**
   * 4. Confirm a booking (for admin)
   */
  async confirmBooking(bookingId: number) {
    return this.db.query(
      `UPDATE dinein_bookings SET status = 'confirmed' WHERE id = $1 RETURNING *`,
      [bookingId],
    );
  }

  /**
   * 5. View all bookings (admin view)
   */
  async getAllBookings() {
    return this.db.query(
      `SELECT b.*, u.name AS user_name, r.name AS restaurant_name
       FROM dinein_bookings b
       JOIN users u ON u.id = b.user_id
       JOIN restaurants r ON r.id = b.restaurant_id
       ORDER BY booking_date DESC, booking_time DESC`
    );
  }

  /**
   * 6. Get bookings for a restaurant (admin)
   */
  async getRestaurantBookings(restaurantId: number) {
    return this.db.query(
      `SELECT b.*, u.name AS user_name 
       FROM dinein_bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.restaurant_id = $1 
       ORDER BY booking_date DESC, booking_time DESC`,
      [restaurantId],
    );
  }

  /**
   * 7. Get available time slots (optional advanced feature)
   */
  async getAvailableTimeSlots(restaurantId: number, bookingDate: string) {
    // This assumes all slots every hour between 11am–10pm
    const allSlots = [
      '11:00', '12:00', '13:00', '14:00', '15:00',
      '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
    ];

    const result = await this.db.query(
      `SELECT booking_time FROM dinein_bookings 
       WHERE restaurant_id = $1 AND booking_date = $2`,
      [restaurantId, bookingDate],
    );

    const bookedSlots = result.rows.map(r => r.booking_time.slice(0, 5)); // Trim seconds
    const availableSlots = allSlots.filter(s => !bookedSlots.includes(s));

    return { availableSlots };
  }
}
