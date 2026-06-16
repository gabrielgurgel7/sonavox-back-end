import { Request, Response } from "express";
import { z } from "zod";
import {
  GetCategoriesUseCase,
  GetCategoryByIdUseCase,
  CreateCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
} from "../../../application/use-cases/category/CategoryUseCases";
import {
  GetOrdersUseCase,
  GetMyOrdersUseCase,
  GetOrderByIdUseCase,
  CreateCheckoutUseCase,
  CancelOrderUseCase,
  UpdateOrderStatusUseCase,
  HandleWebhookUseCase,
} from "../../../application/use-cases/order/OrderUseCases";
import { AuthRequest } from "../middlewares";

// -- Category Controller --
export class CategoryController {
  constructor(
    private getCategoriesUC: GetCategoriesUseCase,
    private getCategoryByIdUC: GetCategoryByIdUseCase,
    private createCategoryUC: CreateCategoryUseCase,
    private updateCategoryUC: UpdateCategoryUseCase,
    private deleteCategoryUC: DeleteCategoryUseCase
  ) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const params = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
      search: req.query.search as string,
    };
    const result = await this.getCategoriesUC.execute(params);
    res.json({ success: true, data: result });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const cat = await this.getCategoryByIdUC.execute(req.params.id);
    res.json({ success: true, data: cat.toJSON() });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const schema = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      parentId: z
        .string()
        .uuid()
        .optional()
        .or(z.literal(""))
        .transform((val) => (val === "" ? undefined : val)),
    });
    const data = schema.parse(req.body);
    console.log("Creating category with data:", data, "and file:", req.file);
    const cat = await this.createCategoryUC.execute(data, req.file);
    res.status(201).json({ success: true, data: cat.toJSON() });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const cat = await this.updateCategoryUC.execute(req.params.id, req.body);
    res.json({ success: true, data: cat.toJSON() });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.deleteCategoryUC.execute(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  };
}

// -- Order Controller --
const shippingAddressSchema = z.object({
  street: z.string(),
  number: z.string(),
  complement: z.string().optional(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  zipCode: z.string(),
});

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1),
    })
  ),
  shippingAddress: shippingAddressSchema,
  notes: z.string().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export class OrderController {
  constructor(
    private getOrdersUC: GetOrdersUseCase,
    private getMyOrdersUC: GetMyOrdersUseCase,
    private getOrderByIdUC: GetOrderByIdUseCase,
    private createCheckoutUC: CreateCheckoutUseCase,
    private cancelOrderUC: CancelOrderUseCase,
    private updateStatusUC: UpdateOrderStatusUseCase,
    private webhookUC: HandleWebhookUseCase
  ) {}

  getAll = async (req: AuthRequest, res: Response): Promise<void> => {
    const params = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      userId: req.query.userId as string,
      status: req.query.status as string,
    };
    const result = await this.getOrdersUC.execute(params);
    res.json({ success: true, data: result });
  };

  getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    const params = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    };
    const result = await this.getMyOrdersUC.execute(req.user!.userId, params);
    res.json({ success: true, data: result });
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const order = await this.getOrderByIdUC.execute(
      req.params.id,
      req.user!.userId,
      req.user!.role === "ADMIN"
    );
    res.json({ success: true, data: order.toJSON() });
  };

  checkout = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = checkoutSchema.parse(req.body);
    const { order, checkoutUrl } = await this.createCheckoutUC.execute({
      ...data,
      userId: req.user!.userId,
    });
    res
      .status(201)
      .json({ success: true, data: { order: order.toJSON(), checkoutUrl } });
  };

  cancel = async (req: AuthRequest, res: Response): Promise<void> => {
    const order = await this.cancelOrderUC.execute(
      req.params.id,
      req.user!.userId,
      req.user!.role === "ADMIN"
    );
    res.json({ success: true, data: order.toJSON() });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
    const order = await this.updateStatusUC.execute(req.params.id, status);
    res.json({ success: true, data: order.toJSON() });
  };

  webhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers["stripe-signature"] as string;
    await this.webhookUC.execute(req.body as Buffer, sig);
    res.json({ received: true });
  };
}
