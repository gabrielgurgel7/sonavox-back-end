import { Pool } from 'pg';
import { User } from '../../../../domain/entities/User';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { PaginatedResult, PaginationParams } from '../../../../shared/types';

export class PostgresUserRepository implements IUserRepository {
  constructor(private pool: Pool) {}

  private mapRow(row: any): User {
    return new User({
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role,
      avatarUrl: row.avatar_url,
      stripeCustomerId: row.stripe_customer_id,
      refreshToken: row.refresh_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async findById(id: string): Promise<User | null> {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<User>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    const values: any[] = [];

    if (params.search) {
      query += ` WHERE name ILIKE $1 OR email ILIKE $1`;
      countQuery += ` WHERE name ILIKE $1 OR email ILIKE $1`;
      values.push(`%${params.search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const [{ rows }, { rows: countRows }] = await Promise.all([
      this.pool.query(query, values),
      this.pool.query(countQuery, params.search ? [`%${params.search}%`] : []),
    ]);

    const total = parseInt(countRows[0].count);
    return {
      data: rows.map(this.mapRow.bind(this)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (id, name, email, password, role, avatar_url, stripe_customer_id, refresh_token, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [user.id, user.name, user.email, user.password, user.role, user.avatarUrl,
       user.stripeCustomerId, user.refreshToken, user.createdAt, user.updatedAt],
    );
  }

  async update(user: User): Promise<void> {
    await this.pool.query(
      `UPDATE users SET name=$2, email=$3, role=$4, avatar_url=$5, stripe_customer_id=$6,
       refresh_token=$7, updated_at=$8 WHERE id=$1`,
      [user.id, user.name, user.email, user.role, user.avatarUrl,
       user.stripeCustomerId, user.refreshToken, user.updatedAt],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}
