import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  // 1. Create new user
  async createUser(data: { name: string; phone: string; email: string }) {
    const query = `INSERT INTO users (name, phone, email) VALUES ($1,$2,$3) RETURNING *`;
    return this.db.query(query, [data.name, data.phone, data.email]);
  }

  // 2. Get user by ID
  async getUserById(id: number) {
    return this.db.query(`SELECT * FROM users WHERE id = $1`, [id]);
  }

  // 3. Get user by phone or email (for chatbot or login)
  async getUserByPhoneOrEmail(identifier: string) {
    return this.db.query(
      `SELECT * FROM users WHERE phone = $1 OR email = $1 LIMIT 1`,
      [identifier],
    );
  }

  // 4. Update user profile
  async updateUser(id: number, data: { name?: string; phone?: string; email?: string }) {
    const updates: string[] = [];
    const values: any[] = [];
    let index = 1;

    for (const key of Object.keys(data)) {
      updates.push(`${key} = $${index}`);
      values.push((data as any)[key]);
      index++;
    }

    values.push(id); // for the WHERE clause

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`;
    return this.db.query(query, values);
  }


  // 5. Delete user account
  async deleteUser(id: number) {
    return this.db.query(`DELETE FROM users WHERE id = $1`, [id]);
  }

  // 6. List all users (admin-only)
  async getAllUsers() {
    return this.db.query(`SELECT * FROM users ORDER BY id`);
  }

  // 7. Track user order history
  async getUserOrderHistory(userId: number) {
    return this.db.query(
      `SELECT o.*, r.name as restaurant_name FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [userId],
    );
  }

  // 8. Get chatbot-friendly user profile (name, favs, history etc.)
  async getChatbotProfile(userId: number) {
    const user = await this.getUserById(userId);
    const orders = await this.getUserOrderHistory(userId);
    return {
      user: user.rows[0],
      recent_orders: orders.rows.slice(0, 3), // latest 3 orders
    };
  }
}
