import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MenusService {
  constructor(private db: DatabaseService) {}

  // 1. Get all menu items
  getAll() {
    return this.db.query('SELECT * FROM menus');
  }

  // 2. Get menu by ID
  getById(id: number) {
    return this.db.query('SELECT * FROM menus WHERE id = $1', [id]);
  }

  // 3. Get menu by restaurant ID
  getByRestaurantId(restaurantId: number) {
    return this.db.query('SELECT * FROM menus WHERE restaurant_id = $1', [restaurantId]);
  }

  // 4. Veg / Non-Veg Filters
  getVegItems(restaurantId: number) {
    return this.db.query('SELECT * FROM menus WHERE restaurant_id = $1 AND is_veg = true', [restaurantId]);
  }

  getNonVegItems(restaurantId: number) {
    return this.db.query('SELECT * FROM menus WHERE restaurant_id = $1 AND is_veg = false', [restaurantId]);
  }

  // 5. Category filter
  getByCategory(restaurantId: number, category: string) {
    return this.db.query(
      'SELECT * FROM menus WHERE restaurant_id = $1 AND LOWER(category) = LOWER($2)',
      [restaurantId, category],
    );
  }

  // 6. Search by name
  searchItemsByName(restaurantId: number, keyword: string) {
    return this.db.query(
      `SELECT * FROM menus WHERE restaurant_id = $1 AND LOWER(item_name) LIKE LOWER($2)`,
      [restaurantId, `%${keyword}%`],
    );
  }

  // 7. Price filter
  getItemsByPriceRange(restaurantId: number, min: number, max: number) {
    return this.db.query(
      'SELECT * FROM menus WHERE restaurant_id = $1 AND price BETWEEN $2 AND $3',
      [restaurantId, min, max],
    );
  }

  // 8. Get all distinct categories for a restaurant
  getCategoriesByRestaurant(restaurantId: number) {
    return this.db.query(
      'SELECT DISTINCT category FROM menus WHERE restaurant_id = $1',
      [restaurantId],
    );
  }

  // 9. Add a new menu item (admin use)
  async addMenuItem(data: {
    restaurant_id: number;
    item_name: string;
    price: number;
    is_veg: boolean;
    category: string;
  }) {
    const { restaurant_id, item_name, price, is_veg, category } = data;
    return this.db.query(
      `INSERT INTO menus (restaurant_id, item_name, price, is_veg, category)
       VALUES ($1, $2, $3, $4, $5)`,
      [restaurant_id, item_name, price, is_veg, category],
    );
  }

  // 10. Update an existing menu item (admin use)
  // async updateMenuItem(id: number, data: Partial<{
  //   item_name: string;
  //   price: number;
  //   is_veg: boolean;
  //   category: string;
  // }>) {
  //   const fields = [];
  //   const values = [];
  //   let index = 1;

  //   for (const key in data) {
  //     fields.push(`${key} = $${index++}`);
  //     values.push((data as any)[key]);
  //   }

  //   if (fields.length === 0) return;

  //   values.push(id);
  //   const query = `UPDATE menus SET ${fields.join(', ')} WHERE id = $${index}`;
  //   return this.db.query(query, values);
  // }
}
