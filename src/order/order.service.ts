import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface MenuItemData {
  dishname: string;
  quantity: number;
  price: number;
  menuId: number;
}

@Injectable()
export class OrderService {
  constructor(private readonly db: DatabaseService) {}

  // 1. Place order with fuzzy name matching
  async placeOrder(
    user_id: number,
    restaurant_id: number,
    items: { dishname: string; quantity: number }[],
  ) {
    const menuData: MenuItemData[] = [];

    for (const item of items) {
      const res = await this.db.query(
        `SELECT id, item_name, price
         FROM menus
         WHERE restaurant_id = $1
           AND item_name ILIKE '%' || $2 || '%'
         LIMIT 1`,
        [restaurant_id, item.dishname],
      );

      if (res.rows.length === 0) {
        throw new Error(`Dish "${item.dishname}" not found`);
      }

      menuData.push({
        dishname: res.rows[0].item_name,
        quantity: item.quantity,
        price: res.rows[0].price,
        menuId: res.rows[0].id,
      });
    }

    const totalPrice = menuData.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Save the order
    const orderRes = await this.db.query(
      `INSERT INTO orders (user_id, restaurant_id, total_amount)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [user_id, restaurant_id, totalPrice],
    );
    const orderId = orderRes.rows[0].id;

    for (const item of menuData) {
      await this.db.query(
        `INSERT INTO order_items (order_id, menu_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.menuId, item.quantity, item.price],
      );
    }

    return { orderId, totalPrice, items: menuData };
  }

  // 2. Track order
  async trackOrder(orderId: number) {
  // Fetch the order
  const orderRes = await this.db.query(
    'SELECT id, user_id, restaurant_id, total_amount, status FROM orders WHERE id = $1',
    [orderId],
  );
  const order = orderRes.rows[0];
  if (!order) return null;

  // Fetch the order items along with menu item names
  const itemsRes = await this.db.query(
    `SELECT oi.quantity, oi.price, m.item_name
     FROM order_items oi
     JOIN menus m ON oi.menu_id = m.id
     WHERE oi.order_id = $1`,
    [orderId],
  );

  // Return order summary
  return {
    orderId: order.id,
    userId: order.user_id,
    restaurantId: order.restaurant_id,
    totalAmount: order.total_amount,
    status: order.status,
    items: itemsRes.rows.map(r => ({
      name: r.item_name,
      quantity: r.quantity,
      price: r.price,
    })),
  };
}


  // 3. Cancel order
  async cancelOrder(orderId: number) {
    const res = await this.db.query(
      'SELECT status FROM orders WHERE id = $1',
      [orderId],
    );
    const status = res.rows[0]?.status;

    if (!status || ['delivered', 'cancelled'].includes(status)) {
      return { success: false, message: 'Cannot cancel this order.' };
    }

    await this.db.query(
      `UPDATE orders SET status = 'cancelled' WHERE id = $1`,
      [orderId],
    );
    return { success: true, message: 'Order cancelled.' };
  }

  // 4. Update order status (admin/restaurant)
  async updateStatus(orderId: number, newStatus: string) {
    await this.db.query(
      `UPDATE orders SET status = $1 WHERE id = $2`,
      [newStatus, orderId],
    );
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
         COALESCE(SUM(total_price), 0) AS total_revenue
       FROM orders
       WHERE restaurant_id = $1 AND created_at::date = CURRENT_DATE`,
      [restaurantId],
    );
    return res.rows[0];
  }
}
