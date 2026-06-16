import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

// Infrastructure
import { getPool } from './infrastructure/database/postgres/connection';
import { PostgresUserRepository } from './infrastructure/database/postgres/repositories/PostgresUserRepository';
import { PostgresProductRepository } from './infrastructure/database/postgres/repositories/PostgresProductRepository';
import { PostgresCategoryRepository } from './infrastructure/database/postgres/repositories/PostgresCategoryRepository';
import { PostgresOrderRepository } from './infrastructure/database/postgres/repositories/PostgresOrderRepository';
import { BcryptHashService, JwtTokenService } from './infrastructure/auth';
import { CloudinaryStorageService } from './infrastructure/storage/CloudinaryStorageService';
import { StripePaymentService } from './infrastructure/payment/StripePaymentService';

// Use cases
import { RegisterUseCase, LoginUseCase, RefreshTokenUseCase, LogoutUseCase } from './application/use-cases/auth/AuthUseCases';
import { GetProductsUseCase, GetProductByIdUseCase, CreateProductUseCase, UpdateProductUseCase, DeleteProductUseCase, UploadProductImageUseCase, DeleteProductImageUseCase } from './application/use-cases/product/ProductUseCases';
import { GetCategoriesUseCase, GetCategoryByIdUseCase, CreateCategoryUseCase, UpdateCategoryUseCase, DeleteCategoryUseCase } from './application/use-cases/category/CategoryUseCases';
import { GetOrdersUseCase, GetMyOrdersUseCase, GetOrderByIdUseCase, CreateCheckoutUseCase, CancelOrderUseCase, UpdateOrderStatusUseCase, HandleWebhookUseCase } from './application/use-cases/order/OrderUseCases';
import { GetUsersUseCase, GetUserByIdUseCase, UpdateProfileUseCase, DeleteUserUseCase } from './application/use-cases/user/UserUseCases';

// Controllers
import { AuthController } from './infrastructure/http/controllers/AuthController';
import { ProductController } from './infrastructure/http/controllers/ProductController';
import { CategoryController, OrderController } from './infrastructure/http/controllers/CategoryOrderController';
import { UserController } from './infrastructure/http/controllers/UserController';

// Routes
import { createAuthRoutes, createProductRoutes, createCategoryRoutes, createOrderRoutes, createUserRoutes } from './infrastructure/http/routes';
import { errorHandler, notFound } from './infrastructure/http/middlewares';

// Swagger
import { swaggerSpec } from './infrastructure/http/swagger';

async function bootstrap() {
  const app = express();
  const pool = getPool();

  const userRepo = new PostgresUserRepository(pool);
  const productRepo = new PostgresProductRepository(pool);
  const categoryRepo = new PostgresCategoryRepository(pool);
  const orderRepo = new PostgresOrderRepository(pool);

  const hashService = new BcryptHashService();
  const tokenService = new JwtTokenService();
  const storageService = new CloudinaryStorageService();
  const paymentService = new StripePaymentService();

  const registerUC = new RegisterUseCase(userRepo, hashService, tokenService);
  const loginUC = new LoginUseCase(userRepo, hashService, tokenService);
  const refreshUC = new RefreshTokenUseCase(userRepo, tokenService);
  const logoutUC = new LogoutUseCase(userRepo);

  const getProductsUC = new GetProductsUseCase(productRepo);
  const getProductByIdUC = new GetProductByIdUseCase(productRepo);
  const createProductUC = new CreateProductUseCase(productRepo);
  const updateProductUC = new UpdateProductUseCase(productRepo);
  const deleteProductUC = new DeleteProductUseCase(productRepo);
  const uploadImageUC = new UploadProductImageUseCase(productRepo, storageService);
  const deleteImageUC = new DeleteProductImageUseCase(productRepo, storageService);

  const getCategoriesUC = new GetCategoriesUseCase(categoryRepo);
  const getCategoryByIdUC = new GetCategoryByIdUseCase(categoryRepo);
  const createCategoryUC = new CreateCategoryUseCase(categoryRepo, storageService);
  const updateCategoryUC = new UpdateCategoryUseCase(categoryRepo);
  const deleteCategoryUC = new DeleteCategoryUseCase(categoryRepo);

  const getOrdersUC = new GetOrdersUseCase(orderRepo);
  const getMyOrdersUC = new GetMyOrdersUseCase(orderRepo);
  const getOrderByIdUC = new GetOrderByIdUseCase(orderRepo);
  const createCheckoutUC = new CreateCheckoutUseCase(orderRepo, productRepo, userRepo, paymentService);
  const cancelOrderUC = new CancelOrderUseCase(orderRepo);
  const updateStatusUC = new UpdateOrderStatusUseCase(orderRepo);
  const webhookUC = new HandleWebhookUseCase(orderRepo, productRepo, paymentService);

  const getUsersUC = new GetUsersUseCase(userRepo);
  const getUserByIdUC = new GetUserByIdUseCase(userRepo);
  const updateProfileUC = new UpdateProfileUseCase(userRepo, storageService);
  const deleteUserUC = new DeleteUserUseCase(userRepo);

  const authController = new AuthController(registerUC, loginUC, refreshUC, logoutUC);
  const productController = new ProductController(getProductsUC, getProductByIdUC, createProductUC, updateProductUC, deleteProductUC, uploadImageUC, deleteImageUC);
  const categoryController = new CategoryController(getCategoriesUC, getCategoryByIdUC, createCategoryUC, updateCategoryUC, deleteCategoryUC);
  const orderController = new OrderController(getOrdersUC, getMyOrdersUC, getOrderByIdUC, createCheckoutUC, cancelOrderUC, updateStatusUC, webhookUC);
  const userController = new UserController(getUsersUC, getUserByIdUC, updateProfileUC, deleteUserUC);

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
  //app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(cors())
  app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ----- Swagger -----
  const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    customSiteTitle: 'E-Commerce API Docs',
    customCss: `
      .topbar { background-color: #1a1a2e; }
      .topbar-wrapper::after { content: 'E-Commerce API'; color: white; font-size: 1.2rem; font-weight: bold; margin-left: 1rem; }
      .swagger-ui .info .title { color: #1a1a2e; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      filter: true,
      syntaxHighlight: { theme: 'monokai' },
    },
  };

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.get('/docs.json', (_, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  const apiPrefix = '/api';
  app.use(`${apiPrefix}/auth`, createAuthRoutes(authController));
  app.use(`${apiPrefix}/products`, createProductRoutes(productController));
  app.use(`${apiPrefix}/categories`, createCategoryRoutes(categoryController));
  app.use(`${apiPrefix}/orders`, createOrderRoutes(orderController));
  app.use(`${apiPrefix}/users`, createUserRoutes(userController));

  app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Swagger UI:   http://localhost:${PORT}/docs`);
    console.log(`📄 OpenAPI JSON: http://localhost:${PORT}/docs.json`);
    console.log(`📦 Environment:  ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap().catch(console.error);
