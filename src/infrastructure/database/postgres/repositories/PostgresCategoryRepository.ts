import { Pool } from 'pg';
import { Category } from '../../../../domain/entities/Category';
import { ICategoryRepository } from '../../../../domain/repositories/ICategoryRepository';
import { PaginatedResult, PaginationParams } from '../../../../shared/types';

export class PostgresCategoryRepository implements ICategoryRepository {
  constructor(private pool: Pool) {}

  private mapRow(row: any): Category {
    return new Category({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      imageUrl: row.image_url,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async findById(id: string): Promise<Category | null> {
    const { rows } = await this.pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const { rows } = await this.pool.query('SELECT * FROM categories WHERE slug = $1', [slug]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<Category>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let where = '';
    const values: any[] = [];
    if (params.search) { where = 'WHERE name ILIKE $1'; values.push(`%${params.search}%`); }

    const [{ rows }, { rows: countRows }] = await Promise.all([
      this.pool.query(`SELECT * FROM categories ${where} ORDER BY name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`, [...values, limit, offset]),
      this.pool.query(`SELECT COUNT(*) FROM categories ${where}`, values),
    ]);

    const total = parseInt(countRows[0].count);
    return { data: rows.map(this.mapRow.bind(this)), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async save(category: Category): Promise<void> {
    console.log('Saving category:', category);
    await this.pool.query(
      'INSERT INTO categories (id, name, slug, description, image_url, parent_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [category.id, category.name, category.slug, category.description, category.imageUrl, category.parentId, category.createdAt, category.updatedAt],
    );
  }

  async update(category: Category): Promise<void> {
    await this.pool.query(
      'UPDATE categories SET name=$2, slug=$3, description=$4, image_url=$5, parent_id=$6, updated_at=$7 WHERE id=$1',
      [category.id, category.name, category.slug, category.description, category.imageUrl, category.parentId, category.updatedAt],
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM categories WHERE id = $1', [id]);
  }
}
