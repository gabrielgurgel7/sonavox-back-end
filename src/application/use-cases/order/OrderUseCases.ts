import { v4 as uuid } from "uuid";
import {
  Order,
  OrderItem,
  ShippingAddress,
  OrderStatus,
} from "../../../domain/entities/Order";
import { IOrderRepository } from "../../../domain/repositories/IOrderRepository";
import { IProductRepository } from "../../../domain/repositories/IProductRepository";
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { IPaymentService } from "../../ports";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../../../shared/errors/AppError";
import { PaginatedResult, PaginationParams } from "../../../shared/types";

export interface CheckoutItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  userId: string;
  items: CheckoutItem[];
  shippingAddress: ShippingAddress;
  notes?: string;
  successUrl: string;
  cancelUrl: string;
}

export class CreateCheckoutUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private productRepository: IProductRepository,
    private userRepository: IUserRepository,
    private paymentService: IPaymentService,
  ) {}

  async execute(
    input: CreateOrderInput,
  ): Promise<{ order: Order; checkoutUrl: string }> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) throw new NotFoundError("User");

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) throw new NotFoundError(`Product ${item.productId}`);
      if (!product.isActive)
        throw new ValidationError(`Product ${product.name} is not available`);
      if (!product.hasStock(item.quantity)) {
        throw new ValidationError(`Insufficient stock for ${product.name}`);
      }

      const totalPrice = product.price * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        id: uuid(),
        productId: product.id,
        productName: product.name,
        productImage: product.mainImage?.url,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice,
      });
    }

    const shipping = subtotal > 100 ? 0 : 9.99;
    const total = subtotal + shipping;

    const order = new Order({
      id: uuid(),
      userId: input.userId,
      items: orderItems,
      status: "PENDING",
      subtotal,
      discount: 0,
      shipping,
      total,
      shippingAddress: input.shippingAddress,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.orderRepository.save(order);

    // Create Stripe session
    const session = await this.paymentService.createCheckoutSession({
      orderId: order.id,
      userId: user.id,
      customerEmail: user.email,
      stripeCustomerId: user.stripeCustomerId,
      items: orderItems.map((i) => ({
        name: i.productName,
        imageUrl: i.productImage,
        unitPrice: Math.round(i.unitPrice * 100), // cents
        quantity: i.quantity,
      })),
      shippingAmount: Math.round(shipping * 100),
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: { orderId: order.id },
    });

    order.setStripeSession(session.sessionId);
    await this.orderRepository.update(order);

    return { order, checkoutUrl: session.url };
  }
}

export class HandleWebhookUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private productRepository: IProductRepository,
    private paymentService: IPaymentService,
  ) {}

  async execute(payload: Buffer, signature: string): Promise<void> {
    const event = this.paymentService.constructWebhookEvent(payload, signature);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const order = await this.orderRepository.findByStripeSession(session.id);
      if (!order) return;

      order.updateStatus("PAID");
      order.setStripePaymentIntent(session.payment_intent);
      await this.orderRepository.update(order);

      // Decrease stock
      for (const item of order.items) {
        const product = await this.productRepository.findById(item.productId);
        if (product) {
          product.decreaseStock(item.quantity);
          await this.productRepository.update(product);
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const order = await this.orderRepository.findByStripeSession(session.id);
      if (order && order.status === "PENDING") {
        order.updateStatus("CANCELLED");
        await this.orderRepository.update(order);
      }
    }
  }
}

export class GetOrdersUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(
    params: PaginationParams & { userId?: string; status?: OrderStatus },
  ): Promise<PaginatedResult<Order>> {
    return this.orderRepository.findAll(params);
  }
}

export class GetMyOrdersUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(
    userId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Order>> {
    return this.orderRepository.findByUserId(userId, params);
  }
}

export class GetOrderByIdUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(id: string, userId: string, isAdmin: boolean): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundError("Order");
    if (!isAdmin && order.userId !== userId) throw new ForbiddenError();
    return order;
  }
}

export class CancelOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(id: string, userId: string, isAdmin: boolean): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundError("Order");
    if (!isAdmin && order.userId !== userId) throw new ForbiddenError();
    order.cancel();
    await this.orderRepository.update(order);
    return order;
  }
}

export class UpdateOrderStatusUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(id: string, status: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundError("Order");
    order.updateStatus(status as OrderStatus);
    await this.orderRepository.update(order);
    return order;
  }
}
