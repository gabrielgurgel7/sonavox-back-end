import { Pool } from 'pg';
import { Order, OrderItem, OrderStatus } from '../../../../domain/entities/Order';
import { IOrderRepository, OrderFilters } from '../../../../domain/repositories/IOrderRepository';
import { PaginatedResult, PaginationParams } from '../../../../shared/types';

export class PostgresOrderRepository implements IOrderRepository {
  constructor(private pool: Pool) {}

  private async getItems(orderId: string): Promise<OrderItem[]> {
    const { rows } = await this.pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    return rows.map(r => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      productImage: r.product_image,
      quantity: r.quantity,
      unitPrice: parseFloat(r.unit_price),
      totalPrice: parseFloat(r.total_price),
    }));
  }

  private mapRow(row: any, items: OrderItem[] = []): Order {
    return new Order({
      id: row.id,
      userId: row.user_id,
      items,
      status: row.status as OrderStatus,
      subtotal: parseFloat(row.subtotal),
      discount: parseFloat(row.discount),
      shipping: parseFloat(row.shipping),
      total: parseFloat(row.total),
      shippingAddress: row.shipping_address,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      stripeSessionId: row.stripe_session_id,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async findById(id: string): Promise<Order | null> {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!rows[0]) return null;
    const items = await this.getItems(id);
    return this.mapRow(rows[0], items);
  }

  async findByStripeSession(sessionId: string): Promise<Order | null> {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE stripe_session_id = $1', [sessionId]);
    if (!rows[0]) return null;
    const items = await this.getItems(rows[0].id);
    return this.mapRow(rows[0], items);
  }

  async findAll(params: OrderFilters): Promise<PaginatedResult<Order>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.userId) { conditions.push(`user_id = $${idx}`); values.push(params.userId); idx++; }
    if (params.status) { conditions.push(`status = $${idx}`); values.push(params.status); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [{ rows }, { rows: countRows }] = await Promise.all([
      this.pool.query(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...values, limit, offset]),
      this.pool.query(`SELECT COUNT(*) FROM orders ${where}`, values),
    ]);

    const orders = await Promise.all(rows.map(async r => {
      const items = await this.getItems(r.id);
      return this.mapRow(r, items);
    }));

    const total = parseInt(countRows[0].count);
    return { data: orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUserId(userId: string, params: PaginationParams): Promise<PaginatedResult<Order>> {
    return this.findAll({ ...params, userId });
  }

  async save(order: Order): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO orders (id, user_id, status, subtotal, discount, shipping, total, shipping_address, stripe_session_id, notes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [order.id, order.userId, order.status, order.subtotal, order.discount, order.shipping,
         order.total, JSON.stringify(order.shippingAddress), order.stripeSessionId, order.notes,
         order.createdAt, order.updatedAt],
      );
      for (const item of order.items) {
        await client.query(
          'INSERT INTO order_items (id, order_id, product_id, product_name, product_image, quantity, unit_price, total_price) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [item.id, order.id, item.productId, item.productName, item.productImage, item.quantity, item.unitPrice, item.totalPrice],
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async update(order: Order): Promise<void> {
    await this.pool.query(
      `UPDATE orders SET status=$2, stripe_payment_intent_id=$3, stripe_session_id=$4, updated_at=$5 WHERE id=$1`,
      [order.id, order.status, order.stripePaymentIntentId, order.stripeSessionId, order.updatedAt],
    );
  }
}
