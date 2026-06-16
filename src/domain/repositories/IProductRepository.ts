import { Product } from '../entities/Product';
import { PaginatedResult, PaginationParams } from '../../shared/types';

export interface ProductFilters extends PaginationParams {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(params: ProductFilters): Promise<PaginatedResult<Product>>;
  save(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
