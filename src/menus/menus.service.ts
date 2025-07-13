// src/menus/menus.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MenusService {
  constructor(private readonly db: DatabaseService) {}

  /** Helper: run a query and return rows */
  private async queryRows(sql: string, params: any[] = []) {
    const { rows } = await this.db.query(sql, params);
    return rows;
  }

  /** 1. Get all menu items */
  async getAll() {
    return this.queryRows('SELECT * FROM menus');
  }

  /** 2. Get menu item by ID */
  async getById(id: number) {
    const rows = await this.queryRows('SELECT * FROM menus WHERE id = $1', [id]);
    if (!rows.length) throw new NotFoundException(`Menu ${id} not found`);
    return rows[0];
  }

  /** 3. Get all items for a restaurant */
  async getByRestaurantId(restaurantId: number) {
    return this.queryRows(
      'SELECT * FROM menus WHERE restaurant_id = $1',
      [restaurantId],
    );
  }

  /** 4. Filter veg or non‑veg */
  async getVegItems(restaurantId: number) {
    return this.queryRows(
      'SELECT * FROM menus WHERE restaurant_id = $1 AND is_veg = true',
      [restaurantId],
    );
  }
  async getNonVegItems(restaurantId: number) {
    return this.queryRows(
      'SELECT * FROM menus WHERE restaurant_id = $1 AND is_veg = false',
      [restaurantId],
    );
  }

  /** 5. Filter by category */
  async getByCategory(restaurantId: number, category: string) {
    return this.queryRows(
      `
      SELECT *
      FROM menus
      WHERE restaurant_id = $1
        AND LOWER(category) = LOWER($2)
      `,
      [restaurantId, category.trim()],
    );
  }

  /** 6. Search items by name */
  async searchItemsByName(restaurantId: number, keyword: string) {
    return this.queryRows(
      `
      SELECT *
      FROM menus
      WHERE restaurant_id = $1
        AND LOWER(item_name) LIKE LOWER($2)
      `,
      [restaurantId, `%${keyword.trim()}%`],
    );
  }

  /** 7. Price range filter */
  async getItemsByPriceRange(
    restaurantId: number,
    min: number,
    max: number,
  ) {
    return this.queryRows(
      `
      SELECT *
      FROM menus
      WHERE restaurant_id = $1
        AND price BETWEEN $2 AND $3
      `,
      [restaurantId, min, max],
    );
  }

  /** 8. Distinct categories */
  async getCategoriesByRestaurant(restaurantId: number) {
    const rows = await this.queryRows(
      'SELECT DISTINCT category FROM menus WHERE restaurant_id = $1',
      [restaurantId],
    );
    return rows.map(r => r.category);
  }

  /** 9. Add a new menu item */
  async addMenuItem(data: {
    restaurant_id: number;
    item_name: string;
    price: number;
    is_veg: boolean;
    category: string;
  }) {
    const { restaurant_id, item_name, price, is_veg, category } = data;
    const rows = await this.queryRows(
      `
      INSERT INTO menus (restaurant_id, item_name, price, is_veg, category)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [restaurant_id, item_name.trim(), price, is_veg, category.trim()],
    );
    return rows[0];
  }
}
