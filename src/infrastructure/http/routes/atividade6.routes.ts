import { Router, Request, Response, NextFunction } from "express";

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

export const productRouter = Router();

productRouter.get("/", (req: Request, res: Response): void => {
  const { category } = req.query;
  res.status(200).json({
    message: "Listagem de produtos",
    filter: category ?? null,
  });
});

productRouter.get("/:id", (req: Request, res: Response): void => {
  const id = Number(req.params.id);
  if (id < 0) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }
  res.status(200).json({ message: "Produto encontrado", id });
});

export const orderRouter = Router();

orderRouter.post("/", (req: Request, res: Response): void => {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).json({ message: "Body vazio" });
    return;
  }
  res.status(201).json({ message: "Pedido criado", data: req.body });
});

orderRouter.patch("/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status } = req.body;
  res.status(200).json({ message: "Status atualizado", id, status });
});

orderRouter.delete("/:id", (req: Request, res: Response): void => {
  res.status(204).send();
});
