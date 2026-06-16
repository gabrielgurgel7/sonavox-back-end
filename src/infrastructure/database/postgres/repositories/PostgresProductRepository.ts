import { Pool } from 'pg';
import { Product, ProductImage } from '../../../../domain/entities/Product';
import { IProductRepository, ProductFilters } from '../../../../domain/repositories/IProductRepository';
import { PaginatedResult } from '../../../../shared/types';

export class PostgresProductRepository implements IProductRepository {
  constructor(private pool: Pool) {}

  private mapRow(row: any, images: ProductImage[] = []): Product {
    return new Product({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: parseFloat(row.price),
      compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : undefined,
      stock: row.stock,
      sku: row.sku,
      categoryId: row.category_id,
      images,
      isActive: row.is_active,
      stripePriceId: row.stripe_price_id,
      stripeProductId: row.stripe_product_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  private async getImages(productId: string): Promise<ProductImage[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_main DESC',
      [productId],
    );
    return rows.map(r => ({ id: r.id, url: r.url, publicId: r.public_id, isMain: r.is_main }));
  }

  async findById(id: string): Promise<Product | null> {
    const { rows } = await this.pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (!rows[0]) return null;
    const images = await this.getImages(id);
    return this.mapRow(rows[0], images);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const { rows } = await this.pool.query('SELECT * FROM products WHERE slug = $1', [slug]);
    if (!rows[0]) return null;
    const images = await this.getImages(rows[0].id);
    return this.mapRow(rows[0], images);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const { rows } = await this.pool.query('SELECT * FROM products WHERE sku = $1', [sku]);
    if (!rows[0]) return null;
    return this.mapRow(rows[0]);
  }

  async findAll(params: ProductFilters): Promise<PaginatedResult<Product>> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.search) { conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`); values.push(`%${params.search}%`); idx++; }
    if (params.categoryId) { conditions.push(`category_id = $${idx}`); values.push(params.categoryId); idx++; }
    if (params.minPrice !== undefined) { conditions.push(`price >= $${idx}`); values.push(params.minPrice); idx++; }
    if (params.maxPrice !== undefined) { conditions.push(`price <= $${idx}`); values.push(params.maxPrice); idx++; }
    if (params.isActive !== undefined) { conditions.push(`is_active = $${idx}`); values.push(params.isActive); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const baseQuery = `FROM products ${where}`;

    const [{ rows }, { rows: countRows }] = await Promise.all([
      this.pool.query(`SELECT * ${baseQuery} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`, [...values, limit, offset]),
      this.pool.query(`SELECT COUNT(*) ${baseQuery}`, values),
    ]);

    const products = await Promise.all(rows.map(async r => {
      const images = await this.getImages(r.id);
      return this.mapRow(r, images);
    }));

    const total = parseInt(countRows[0].count);
    return { data: products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async save(product: Product): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO products (id, name, slug, description, price, compare_at_price, stock, sku, category_id, is_active, stripe_product_id, stripe_price_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [product.id, product.name, product.slug, product.description, product.price,
         product.compareAtPrice, product.stock, product.sku, product.categoryId,
         product.isActive, product.stripeProductId, product.stripePriceId,
         product.createdAt, product.updatedAt],
      );
      for (const img of product.images) {
        await client.query(
          'INSERT INTO product_images (id, product_id, url, public_id, is_main) VALUES ($1,$2,$3,$4,$5)',
          [img.id, product.id, img.url, img.publicId, img.isMain],
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

  async update(product: Product): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE products SET name=$2, slug=$3, description=$4, price=$5, compare_at_price=$6,
         stock=$7, sku=$8, category_id=$9, is_active=$10, stripe_product_id=$11, stripe_price_id=$12, updated_at=$13
         WHERE id=$1`,
        [product.id, product.name, product.slug, product.description, product.price,
         product.compareAtPrice, product.stock, product.sku, product.categoryId,
         product.isActive, product.stripeProductId, product.stripePriceId, product.updatedAt],
      );
      await client.query('DELETE FROM product_images WHERE product_id = $1', [product.id]);
      for (const img of product.images) {
        await client.query(
          'INSERT INTO product_images (id, product_id, url, public_id, is_main) VALUES ($1,$2,$3,$4,$5)',
          [img.id, product.id, img.url, img.publicId, img.isMain],
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

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM products WHERE id = $1', [id]);
  }
}
