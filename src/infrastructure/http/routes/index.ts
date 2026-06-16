import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middlewares';
import { AuthController } from '../controllers/AuthController';
import { ProductController } from '../controllers/ProductController';
import { CategoryController, OrderController } from '../controllers/CategoryOrderController';
import { UserController } from '../controllers/UserController';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();
  router.post('/register', controller.register);
  router.post('/login', controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', authenticate, controller.logout);
  router.get('/me', authenticate, controller.me);
  return router;
}

export function createProductRoutes(controller: ProductController): Router {
  const router = Router();
  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', authenticate, authorize('ADMIN'), controller.create);
  router.put('/:id', authenticate, authorize('ADMIN'), controller.update);
  router.delete('/:id', authenticate, authorize('ADMIN'), controller.delete);
  router.post('/:id/images', authenticate, authorize('ADMIN'), upload.single('image'), controller.uploadImage);
  router.delete('/:id/images/:imageId', authenticate, authorize('ADMIN'), controller.deleteImage);
  return router;
}

export function createCategoryRoutes(controller: CategoryController): Router {
  const router = Router();
  router.get('/', controller.getAll);
  router.get('/:id', controller.getById);
  router.post('/', authenticate, authorize('ADMIN'), upload.single('image'), controller.create);
  router.put('/:id', authenticate, authorize('ADMIN'), controller.update);
  router.delete('/:id', authenticate, authorize('ADMIN'), controller.delete);
  return router;
}

export function createOrderRoutes(controller: OrderController): Router {
  const router = Router();
  router.post('/webhook', controller.webhook); // No auth - raw body handled in app
  router.get('/', authenticate, authorize('ADMIN'), controller.getAll);
  router.get('/my', authenticate, controller.getMyOrders);
  router.get('/:id', authenticate, controller.getById);
  router.post('/checkout', authenticate, controller.checkout);
  router.patch('/:id/cancel', authenticate, controller.cancel);
  router.patch('/:id/status', authenticate, authorize('ADMIN'), controller.updateStatus);
  return router;
}

export function createUserRoutes(controller: UserController): Router {
  const router = Router();
  router.get('/', authenticate, authorize('ADMIN'), controller.getAll);
  router.get('/:id', authenticate, controller.getById);
  router.put('/profile', authenticate, upload.single('avatar'), controller.updateProfile);
  router.delete('/:id', authenticate, authorize('ADMIN'), controller.delete);
  return router;
}
