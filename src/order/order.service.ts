import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class OrderService {
  constructor(private readonly db: DatabaseService) {}

  // 1. Place an order
  async placeOrder(
    userId: number,
    restaurantId: number,
    items: { menu_id: number; quantity: number }[],
  ) {
    let total = 0;
    for (const it of items) {
      const res = await this.db.query('SELECT price FROM menus WHERE id = $1', [it.menu_id]);
      const price = res.rows[0]?.price || 0;
      total += price * it.quantity;
    }

    const orderRes = await this.db.query(
      `INSERT INTO orders (user_id, restaurant_id, total_amount, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW()) RETURNING id`,
      [userId, restaurantId, total],
    );
    const orderId = orderRes.rows[0].id;

    for (const it of items) {
      const res = await this.db.query('SELECT price FROM menus WHERE id = $1', [it.menu_id]);
      const price = res.rows[0]?.price || 0;
      await this.db.query(
        `INSERT INTO order_items (order_id, menu_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, it.menu_id, it.quantity, price],
      );
    }

    return { orderId, total };
  }

  // 2. Track order
  async trackOrder(orderId: number) {
    const orderRes = await this.db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const order = orderRes.rows[0];
    if (!order) return null;

    const itemsRes = await this.db.query(
      `SELECT oi.menu_id, m.item_name, oi.quantity, oi.price
       FROM order_items oi
       JOIN menus m ON m.id = oi.menu_id
       WHERE oi.order_id = $1`,
      [orderId],
    );

    return { ...order, items: itemsRes.rows };
  }

  // 3. Cancel order
  async cancelOrder(orderId: number) {
    const res = await this.db.query('SELECT status FROM orders WHERE id = $1', [orderId]);
    const status = res.rows[0]?.status;

    if (!status || ['delivered', 'cancelled'].includes(status)) {
      return { success: false, message: 'Cannot cancel this order.' };
    }

    await this.db.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [orderId]);
    return { success: true, message: 'Order cancelled.' };
  }

  // 4. Update order status (admin/restaurant)
  async updateStatus(orderId: number, newStatus: string) {
    await this.db.query(`UPDATE orders SET status = $1 WHERE id = $2`, [newStatus, orderId]);
    return { success: true, message: `Status updated to ${newStatus}` };
  }

  // 5. Get all orders by user
  async getOrdersByUser(userId: number) {
    const res = await this.db.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return res.rows;
  }

  // 6. Get all orders for a restaurant
  async getOrdersByRestaurant(restaurantId: number) {
    const res = await this.db.query(
      `SELECT * FROM orders WHERE restaurant_id = $1 ORDER BY created_at DESC`,
      [restaurantId],
    );
    return res.rows;
  }

  // 7. Get today's sales summary for a restaurant
  async getSalesSummary(restaurantId: number) {
    const res = await this.db.query(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(total_amount), 0) AS total_revenue
       FROM orders
       WHERE restaurant_id = $1 AND created_at::date = CURRENT_DATE`,
      [restaurantId],
    );
    return res.rows[0];
  }
}
