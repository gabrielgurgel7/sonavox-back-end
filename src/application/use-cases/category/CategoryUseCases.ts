import { v4 as uuid } from 'uuid';
import { Category } from '../../../domain/entities/Category';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { IStorageService } from '../../ports';
import { ConflictError, NotFoundError } from '../../../shared/errors/AppError';
import { PaginatedResult, PaginationParams } from '../../../shared/types';

export class GetCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(params: PaginationParams): Promise<PaginatedResult<Category>> {
    return this.categoryRepository.findAll(params);
  }
}

export class GetCategoryByIdUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category');
    return category;
  }
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
}

export class CreateCategoryUseCase {
  constructor(
    private categoryRepository: ICategoryRepository,
    private storageService?: IStorageService,
  ) {}

  async execute(input: CreateCategoryInput, imageFile?: Express.Multer.File): Promise<Category> {
    const slug = input.name.toLowerCase().replace(/\s+/g, '-');
    const existing = await this.categoryRepository.findBySlug(slug);
    if (existing) throw new ConflictError('Category with this name already exists');

    let imageUrl: string | undefined;
    if (imageFile && this.storageService) {
      const result = await this.storageService.upload(imageFile.buffer, 'categories');
      imageUrl = result.url;
    }

    const category = new Category({
      id: uuid(),
      name: input.name,
      slug,
      description: input.description,
      imageUrl,
      parentId: input.parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.categoryRepository.save(category);
    return category;
  }
}

export class UpdateCategoryUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string, input: Partial<CreateCategoryInput>): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category');
    if (input.name) category.update(input.name, input.description);
    await this.categoryRepository.update(category);
    return category;
  }
}

export class DeleteCategoryUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category');
    await this.categoryRepository.delete(id);
  }
}
