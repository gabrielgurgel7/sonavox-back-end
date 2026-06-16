import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";

const categoryParamsSchema = z.object({
  id: z.string().uuid({ message: "ID deve ser um UUID válido" }),
});

const categoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(10),
});

const createCategorySchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
});

const createProductSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  price: z.number().positive({ message: "Preço deve ser positivo" }),
  categoryId: z
    .string()
    .uuid({ message: "categoryId deve ser um UUID válido" }),
});

const validateData = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ errors: result.error.errors });
      return;
    }
    req.body = result.data;
    next();
  };
};

export const categoryRouter = Router();

categoryRouter.get("/", (req: Request, res: Response): void => {
  const result = categoryQuerySchema.safeParse(req.query);
  if (!result.success) {
    res.status(400).json({ errors: result.error.errors });
    return;
  }
  const { page, size } = result.data;
  res.status(200).json({ message: "Listagem de categorias", page, size });
});

categoryRouter.get("/:id", (req: Request, res: Response): void => {
  const result = categoryParamsSchema.safeParse(req.params);
  if (!result.success) {
    res.status(400).json({ errors: result.error.errors });
    return;
  }
  res.status(200).json({ message: "Categoria encontrada", id: result.data.id });
});

categoryRouter.post(
  "/",
  validateData(createCategorySchema),
  (req: Request, res: Response): void => {
    res.status(201).json({ message: "Categoria criada", data: req.body });
  },
);

categoryRouter.put("/:id", (req: Request, res: Response): void => {
  const paramsResult = categoryParamsSchema.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ errors: paramsResult.error.errors });
    return;
  }
  const bodyResult = createCategorySchema.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ errors: bodyResult.error.errors });
    return;
  }
  res
    .status(200)
    .json({
      message: "Categoria atualizada",
      id: paramsResult.data.id,
      data: bodyResult.data,
    });
});

categoryRouter.delete("/:id", (req: Request, res: Response): void => {
  const result = categoryParamsSchema.safeParse(req.params);
  if (!result.success) {
    res.status(400).json({ errors: result.error.errors });
    return;
  }
  res.status(204).send();
});

export const productRouter = Router();

productRouter.get("/", (req: Request, res: Response): void => {
  const { category } = req.query;
  res
    .status(200)
    .json({ message: "Listagem de produtos", filter: category ?? null });
});

productRouter.post(
  "/",
  validateData(createProductSchema),
  (req: Request, res: Response): void => {
    res.status(201).json({ message: "Produto criado", data: req.body });
  },
);

productRouter.delete("/:id", (req: Request, res: Response): void => {
  const result = categoryParamsSchema.safeParse(req.params);
  if (!result.success) {
    res.status(400).json({ errors: result.error.errors });
    return;
  }
  res.status(204).send();
});
