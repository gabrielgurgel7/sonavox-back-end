import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid({ message: "ID deve ser um UUID válido" }),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(10),
});

const createCategorySchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
});

const createProductSchema = z.object({
  name: z.string().min(3),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  categoryId: z.string().uuid(),
});

const updateProductSchema = createProductSchema.partial();

const validate = (
  schema: z.ZodSchema,
  source: "body" | "params" | "query" = "body",
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({ errors: result.error.errors });
      return;
    }
    req[source] = result.data;
    next();
  };
};

export const categoryRouter = Router();

categoryRouter.get(
  "/",
  validate(querySchema, "query"),
  (req: Request, res: Response): void => {
    const { page, size } = req.query as unknown as {
      page: number;
      size: number;
    };
    res
      .status(200)
      .json({ message: "Listagem de categorias", page, size, data: [] });
  },
);

categoryRouter.get(
  "/:id",
  validate(paramsSchema, "params"),
  (req: Request, res: Response): void => {
    res
      .status(200)
      .json({ message: "Categoria encontrada", id: req.params.id });
  },
);

categoryRouter.post(
  "/",
  validate(createCategorySchema),
  (req: Request, res: Response): void => {
    res.status(201).json({ message: "Categoria criada", data: req.body });
  },
);

categoryRouter.put(
  "/:id",
  validate(paramsSchema, "params"),
  validate(createCategorySchema),
  (req: Request, res: Response): void => {
    res
      .status(200)
      .json({
        message: "Categoria atualizada",
        id: req.params.id,
        data: req.body,
      });
  },
);

categoryRouter.delete(
  "/:id",
  validate(paramsSchema, "params"),
  (req: Request, res: Response): void => {
    // service verifica existência antes de deletar
    res.status(204).send();
  },
);

export const productRouter = Router();

productRouter.get(
  "/",
  validate(querySchema, "query"),
  (req: Request, res: Response): void => {
    const { category } = req.query;
    res.status(200).json({
      message: "Listagem de produtos",
      filter: category ?? null,
      page: (req.query as any).page,
      size: (req.query as any).size,
      data: [],
    });
  },
);

productRouter.get(
  "/:id",
  validate(paramsSchema, "params"),
  (req: Request, res: Response): void => {
    res.status(200).json({ message: "Produto encontrado", id: req.params.id });
  },
);

productRouter.post(
  "/",
  validate(createProductSchema),
  (req: Request, res: Response): void => {
    res.status(201).json({ message: "Produto criado", data: req.body });
  },
);

productRouter.put(
  "/:id",
  validate(paramsSchema, "params"),
  validate(updateProductSchema),
  (req: Request, res: Response): void => {
    res
      .status(200)
      .json({
        message: "Produto atualizado",
        id: req.params.id,
        data: req.body,
      });
  },
);

productRouter.delete(
  "/:id",
  validate(paramsSchema, "params"),
  (req: Request, res: Response): void => {
    res.status(204).send();
  },
);
