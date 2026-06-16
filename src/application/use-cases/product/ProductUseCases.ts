import { v4 as uuid } from "uuid";
import { Product, ProductImage } from "../../../domain/entities/Product";
import {
  IProductRepository,
  ProductFilters,
} from "../../../domain/repositories/IProductRepository";
import { IStorageService } from "../../ports";
import { ConflictError, NotFoundError } from "../../../shared/errors/AppError";
import { PaginatedResult } from "../../../shared/types";

export class GetProductsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(params: ProductFilters): Promise<PaginatedResult<Product>> {
    return this.productRepository.findAll(params);
  }
}

export class GetProductByIdUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundError("Product");
    return product;
  }
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  categoryId: string;
}

export class CreateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const existing = await this.productRepository.findBySku(input.sku);
    if (existing) throw new ConflictError("SKU already in use");

    const product = new Product({
      id: uuid(),
      name: input.name,
      slug: input.name.toLowerCase().replace(/\s+/g, "-"),
      description: input.description,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      stock: input.stock,
      sku: input.sku,
      categoryId: input.categoryId,
      images: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.productRepository.save(product);
    return product;
  }
}

export class UpdateProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(
    id: string,
    input: Partial<CreateProductInput & { isActive: boolean }>,
  ): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundError("Product");

    product.update(input);

    if (input.isActive === true) product.activate();
    if (input.isActive === false) product.deactivate();

    await this.productRepository.update(product);
    return product;
  }
}

export class DeleteProductUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundError("Product");
    await this.productRepository.delete(id);
  }
}

export class UploadProductImageUseCase {
  constructor(
    private productRepository: IProductRepository,
    private storageService: IStorageService,
  ) {}

  async execute(
    productId: string,
    file: Express.Multer.File,
  ): Promise<ProductImage> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError("Product");

    const result = await this.storageService.upload(
      file.buffer,
      "products",
      product.slug,
    );
    const image: ProductImage = {
      id: uuid(),
      url: result.url,
      publicId: result.publicId,
      isMain: product.images.length === 0,
    };

    product.addImage(image);
    await this.productRepository.update(product);
    return image;
  }
}

export class DeleteProductImageUseCase {
  constructor(
    private productRepository: IProductRepository,
    private storageService: IStorageService,
  ) {}

  async execute(productId: string, imageId: string): Promise<void> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError("Product");

    const image = product.images.find((i) => i.id === imageId);
    if (!image) throw new NotFoundError("Image");

    await this.storageService.delete(image.publicId);
    product.removeImage(imageId);
    await this.productRepository.update(product);
  }
}
