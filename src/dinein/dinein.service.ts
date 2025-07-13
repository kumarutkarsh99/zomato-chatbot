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
      (user_id, restaurant_id, booking_date, booking_time, people_count, status) 
      VALUES ($1, $2, $3, $4, $5, 'booked') 
      RETURNING *`;
      
    const values = [
      data.user_id,
      data.restaurant_id,
      data.booking_date,
      data.booking_time,
      data.people_count,
    ];

    const result = await this.db.query(query, values);
    return result.rows[0]; // return inserted booking
  }

  /**
   * 2. View bookings for a user
   */
  async getUserBookings(userId: number) {
    const result = await this.db.query(
      `SELECT b.*, r.name AS restaurant_name 
       FROM dinein_bookings b
       JOIN restaurants r ON r.id = b.restaurant_id
       WHERE b.user_id = $1 
       ORDER BY booking_date DESC, booking_time DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * 3. Cancel a booking
   */
  async cancelBooking(bookingId: number) {
    const result = await this.db.query(
      `UPDATE dinein_bookings 
       SET status = 'cancelled' 
       WHERE id = $1 
       RETURNING *`,
      [bookingId],
    );
    return result.rows[0];
  }

  /**
   * 4. Confirm a booking (admin)
   */
  async confirmBooking(bookingId: number) {
    const result = await this.db.query(
      `UPDATE dinein_bookings 
       SET status = 'confirmed' 
       WHERE id = $1 
       RETURNING *`,
      [bookingId],
    );
    return result.rows[0];
  }

  /**
   * 5. View all bookings (admin view)
   */
  async getAllBookings() {
    const result = await this.db.query(
      `SELECT b.*, u.name AS user_name, r.name AS restaurant_name
       FROM dinein_bookings b
       JOIN users u ON u.id = b.user_id
       JOIN restaurants r ON r.id = b.restaurant_id
       ORDER BY booking_date DESC, booking_time DESC`
    );
    return result.rows;
  }

  /**
   * 6. Get bookings for a restaurant (admin)
   */
  async getRestaurantBookings(restaurantId: number) {
    const result = await this.db.query(
      `SELECT b.*, u.name AS user_name 
       FROM dinein_bookings b
       JOIN users u ON u.id = b.user_id
       WHERE b.restaurant_id = $1 
       ORDER BY booking_date DESC, booking_time DESC`,
      [restaurantId],
    );
    return result.rows;
  }

  /**
   * 7. Get available time slots for a restaurant on a date
   */
  async getAvailableTimeSlots(restaurantId: number, bookingDate: string) {
    const allSlots = [
      '11:00', '12:00', '13:00', '14:00', '15:00',
      '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
    ];

    const result = await this.db.query(
      `SELECT booking_time 
       FROM dinein_bookings 
       WHERE restaurant_id = $1 AND booking_date = $2`,
      [restaurantId, bookingDate],
    );

    const bookedSlots = result.rows.map(row => row.booking_time.slice(0, 5)); // Trim HH:MM:SS → HH:MM
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

    return { availableSlots };
  }
}
