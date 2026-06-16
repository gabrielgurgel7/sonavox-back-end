import { Category } from '../entities/Category';
import { PaginatedResult, PaginationParams } from '../../shared/types';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<Category>>;
  save(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
}
