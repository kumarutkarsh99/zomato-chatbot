// src/restaurant/restaurant.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RestaurantService {
  constructor(private readonly db: DatabaseService) {}

  /** 1. Get all restaurants */
  async getAll() {
    const { rows } = await this.db.query('SELECT * FROM restaurants');
    return rows;
  }

  /** 2. Get a single restaurant by ID */
  async getById(id: number) {
    const { rows } = await this.db.query(
      'SELECT * FROM restaurants WHERE id = $1',
      [id],
    );
    if (!rows.length) throw new NotFoundException(`Restaurant ${id} not found`);
    return rows[0];
  }

  /** 3. Search by name + area (returns a single ID) */
  async searchByNameAndArea(name: string, area: string) {
    const nm = name.trim();
    const ar = area.trim();
    if (!nm || !ar) throw new NotFoundException('Name and area required');

    const { rows } = await this.db.query(
      `
      SELECT id
      FROM restaurants
      WHERE name ILIKE $1
        AND area ILIKE $2
      LIMIT 1
      `,
      [`%${nm}%`, `%${ar}, Bangalore%`],
    );
    if (!rows.length) {
      throw new NotFoundException(`No restaurant for "${nm}" in "${ar}"`);
    }
    return rows[0].id;
  }

  /**
   * 4. Advanced filter: cuisine, area, minRating, maxCost, vegOnly, dineInOnly
   */
  async filterAdvanced(opts: {
    cuisine?: string;
    area?: string;
    minRating?: number;
    maxCost?: number;
    vegOnly?: boolean;
    dineInOnly?: boolean;
    homeDelivery?: boolean;
  }) {
    const clauses: string[] = [];
    const params: any[] = [];

    const add = (sql: string, val?: any) => {
      clauses.push(sql);
      if (val !== undefined) params.push(val);
    };

    if (opts.cuisine) {
      add(`LOWER(cuisines) LIKE LOWER($${params.length + 1})`, `%${opts.cuisine.trim()}%`);
    }
    if (opts.area) {
      add(`LOWER(area) LIKE LOWER($${params.length + 1})`, `%${opts.area.trim()}%`);
    }
    if (opts.minRating !== undefined) {
      add(`(delivery_rating + dinner_rating)/2 >= $${params.length + 1}`, opts.minRating);
    }
    if (opts.maxCost !== undefined) {
      add(`average_cost <= $${params.length + 1}`, opts.maxCost);
    }
    if (opts.vegOnly) {
      clauses.push('is_veg_only = true');
    }
    if (opts.dineInOnly) {
      clauses.push('is_indoor_seating = true');
    }
    if (opts.homeDelivery) {
      clauses.push('is_home_delivery = true');
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const { rows } = await this.db.query(
      `SELECT * FROM restaurants ${where} ORDER BY delivery_rating DESC`,
      params,
    );
    return rows;
  }
}
