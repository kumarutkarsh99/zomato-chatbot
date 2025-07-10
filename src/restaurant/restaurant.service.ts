import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RestaurantService {
  constructor(private db: DatabaseService) {}

  // 1. Get all restaurants
  getAll() {
    return this.db.query('SELECT * FROM restaurants');
  }

  // 2. Get restaurant by ID
  getById(id: number) {
    return this.db.query('SELECT * FROM restaurants WHERE id = $1', [id]);
  }

  // 3. Search restaurant by name
  searchByName(name: string) {
    return this.db.query(
      `SELECT * FROM restaurants WHERE LOWER(name) LIKE LOWER($1)`,
      [`%${name}%`],
    );
  }

  // 4. Filter restaurants by cuisine
  filterByCuisine(cuisine: string) {
    return this.db.query(
      `SELECT * FROM restaurants WHERE LOWER(cuisines) LIKE LOWER($1)`,
      [`%${cuisine}%`],
    );
  }

  // 5. Filter by area/locality
  filterByArea(area: string) {
    return this.db.query(
      `SELECT * FROM restaurants WHERE LOWER(area) LIKE LOWER($1)`,
      [`%${area}%`],
    );
  }

  // 6. Filter by delivery availability
  getDeliveryAvailable() {
    return this.db.query(`SELECT * FROM restaurants WHERE is_home_delivery = true`);
  }

  // 7. Filter by dine-in availability
  getDineInAvailable() {
    return this.db.query(`SELECT * FROM restaurants WHERE is_indoor_seating = true`);
  }

  // 8. Filter by veg/non-veg
  getVegOnly() {
    return this.db.query(`SELECT * FROM restaurants WHERE is_veg_only = true`);
  }

  // 9. Get top-rated restaurants (based on Delivery + Dinner Ratings)
  getTopRated(limit: number = 10) {
    return this.db.query(
      `SELECT * FROM restaurants 
       ORDER BY (delivery_rating + dinner_rating) DESC 
       LIMIT $1`,
      [limit],
    );
  }

  // 10. Get popular restaurants by review count
  getMostReviewed(limit: number = 10) {
    return this.db.query(
      `SELECT * FROM restaurants 
       ORDER BY (delivery_reviews + dinner_reviews) DESC 
       LIMIT $1`,
      [limit],
    );
  }

  // 11. Get restaurants by cost (ascending or descending)
  getByCost(order: 'asc' | 'desc' = 'asc') {
    return this.db.query(
      `SELECT * FROM restaurants 
       ORDER BY average_cost ${order === 'asc' ? 'ASC' : 'DESC'}`,
    );
  }

  // 12. Filter by multiple criteria
  async filterAdvanced({
    cuisine,
    area,
    minRating,
    maxCost,
    vegOnly,
    dineInOnly,
  }: {
    cuisine?: string;
    area?: string;
    minRating?: number;
    maxCost?: number;
    vegOnly?: boolean;
    dineInOnly?: boolean;
  }) {
    let query = 'SELECT * FROM restaurants WHERE 1=1';
    const params: any[] = [];

    if (cuisine) {
      params.push(`%${cuisine}%`);
      query += ` AND LOWER(cuisines) LIKE LOWER($${params.length})`;
    }

    if (area) {
      params.push(`%${area}%`);
      query += ` AND LOWER(area) LIKE LOWER($${params.length})`;
    }

    if (minRating) {
      params.push(minRating);
      query += ` AND (delivery_rating + dinner_rating)/2 >= $${params.length}`;
    }

    if (maxCost) {
      params.push(maxCost);
      query += ` AND average_cost <= $${params.length}`;
    }

    if (vegOnly) {
      query += ` AND is_veg_only = true`;
    }

    if (dineInOnly) {
      query += ` AND is_indoor_seating = true`;
    }

    return this.db.query(query, params);
  }
}
