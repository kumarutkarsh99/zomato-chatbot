import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DataService {
  constructor(private db: DatabaseService) {}

  /**
   * Insert a new restaurant (admin use)
   */
  insertRestaurant(data: any) {
    const query = `INSERT INTO restaurants 
      (name, url, cuisines, area, timing, full_address, phone_number,
      is_home_delivery, take_away, is_indoor_seating, is_veg_only,
      dinner_rating, dinner_reviews, delivery_rating, delivery_reviews,
      known_for, popular_dishes, people_known_for, average_cost)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`;
    const values = [
      data.name, data.url, data.cuisines, data.area, data.timing, data.full_address,
      data.phone_number, data.is_home_delivery, data.take_away, data.is_indoor_seating,
      data.is_veg_only, data.dinner_rating, data.dinner_reviews, data.delivery_rating,
      data.delivery_reviews, data.known_for, data.popular_dishes, data.people_known_for,
      data.average_cost
    ];
    return this.db.query(query, values);
  }

  /**
   * Delete a restaurant by ID (admin)
   */
  deleteRestaurant(id: number) {
    return this.db.query(`DELETE FROM restaurants WHERE id = $1`, [id]);
  }

  /**
   * Update a restaurant by ID (admin)
   */
  async updateRestaurant(id: number, data: any) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const updates = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const query = `UPDATE restaurants SET ${updates} WHERE id = $${keys.length + 1}`;
    return this.db.query(query, [...values, id]);
  }

  /**
   * Bulk insert menus for a restaurant
   */
  async insertMenus(restaurantId: number, menuItems: { item_name: string; price: number; is_veg: boolean; category: string }[]) {
    for (const item of menuItems) {
      await this.db.query(
        `INSERT INTO menus (restaurant_id, item_name, price, is_veg, category) VALUES ($1, $2, $3, $4, $5)`,
        [restaurantId, item.item_name, item.price, item.is_veg, item.category]
      );
    }
    return { message: 'Menus added successfully' };
  }

  /**
   * Delete all menus of a restaurant
   */
  async deleteMenusByRestaurant(restaurantId: number) {
    return this.db.query(`DELETE FROM menus WHERE restaurant_id = $1`, [restaurantId]);
  }

  /**
   * Get all menus of a restaurant
   */
  async getMenusByRestaurant(restaurantId: number) {
    return this.db.query(`SELECT * FROM menus WHERE restaurant_id = $1`, [restaurantId]);
  }

  /**
   * Seed restaurants in bulk from array (CSV alternative)
   */
  async bulkInsertRestaurants(dataArray: any[]) {
    for (const data of dataArray) {
      await this.insertRestaurant(data);
    }
    return { message: 'Bulk insert complete' };
  }

  /**
   * Truncate both restaurants and menus tables (admin reset)
   */
  async truncateAll() {
    await this.db.query(`TRUNCATE TABLE menus, restaurants RESTART IDENTITY CASCADE`);
    return { message: 'All data wiped' };
  }
}
