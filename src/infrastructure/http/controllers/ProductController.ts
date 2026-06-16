import { Request, Response } from "express";
import { z } from "zod";
import {
  GetProductsUseCase,
  GetProductByIdUseCase,
  CreateProductUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
  UploadProductImageUseCase,
  DeleteProductImageUseCase,
} from "../../../application/use-cases/product/ProductUseCases";

const createSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().min(10),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  sku: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
});

export class ProductController {
  constructor(
    private getProductsUC: GetProductsUseCase,
    private getProductByIdUC: GetProductByIdUseCase,
    private createProductUC: CreateProductUseCase,
    private updateProductUC: UpdateProductUseCase,
    private deleteProductUC: DeleteProductUseCase,
    private uploadImageUC: UploadProductImageUseCase,
    private deleteImageUC: DeleteProductImageUseCase,
  ) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const params = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
      categoryId: req.query.categoryId as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      isActive:
        req.query.isActive !== undefined ? req.query.isActive === "true" : true,
    };
    const result = await this.getProductsUC.execute(params);
    res.json({ success: true, data: result });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const product = await this.getProductByIdUC.execute(req.params.id);
    res.json({ success: true, data: product.toJSON() });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const data = createSchema.parse(req.body);
    const product = await this.createProductUC.execute(data);
    res.status(201).json({ success: true, data: product.toJSON() });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    console.log("Update body:", req.body);
    const product = await this.updateProductUC.execute(req.params.id, req.body);
    res.json({ success: true, data: product.toJSON() });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.deleteProductUC.execute(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  };

  uploadImage = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
    const image = await this.uploadImageUC.execute(req.params.id, req.file);
    res.status(201).json({ success: true, data: image });
  };

  deleteImage = async (req: Request, res: Response): Promise<void> => {
    await this.deleteImageUC.execute(req.params.id, req.params.imageId);
    res.json({ success: true, message: "Image deleted" });
  };
}
