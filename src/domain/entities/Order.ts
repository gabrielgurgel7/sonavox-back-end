export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface OrderProps {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  private props: OrderProps;

  constructor(props: OrderProps) {
    this.props = props;
  }

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get items() { return this.props.items; }
  get status() { return this.props.status; }
  get subtotal() { return this.props.subtotal; }
  get discount() { return this.props.discount; }
  get shipping() { return this.props.shipping; }
  get total() { return this.props.total; }
  get shippingAddress() { return this.props.shippingAddress; }
  get stripePaymentIntentId() { return this.props.stripePaymentIntentId; }
  get stripeSessionId() { return this.props.stripeSessionId; }
  get notes() { return this.props.notes; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  canBeCancelled(): boolean {
    return ['PENDING', 'PROCESSING'].includes(this.props.status);
  }

  updateStatus(status: OrderStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  setStripeSession(sessionId: string): void {
    this.props.stripeSessionId = sessionId;
    this.props.updatedAt = new Date();
  }

  setStripePaymentIntent(paymentIntentId: string): void {
    this.props.stripePaymentIntentId = paymentIntentId;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (!this.canBeCancelled()) throw new Error('Order cannot be cancelled at this stage');
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
