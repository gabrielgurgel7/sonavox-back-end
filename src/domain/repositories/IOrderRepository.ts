import { Order, OrderStatus } from '../entities/Order';
import { PaginatedResult, PaginationParams } from '../../shared/types';

export interface OrderFilters extends PaginationParams {
  userId?: string;
  status?: OrderStatus;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByStripeSession(sessionId: string): Promise<Order | null>;
  findAll(params: OrderFilters): Promise<PaginatedResult<Order>>;
  findByUserId(userId: string, params: PaginationParams): Promise<PaginatedResult<Order>>;
  save(order: Order): Promise<void>;
  update(order: Order): Promise<void>;
}
