import Stripe from 'stripe';
import {
  IPaymentService,
  CreateCheckoutSessionInput,
  CheckoutSession,
} from '../../application/ports';

export class StripePaymentService implements IPaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16' as any,
    });
  }

  async createCustomer(email: string, name: string): Promise<string> {
    const customer = await this.stripe.customers.create({ email, name });
    return customer.id;
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession> {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = input.items.map(item => ({
      price_data: {
        currency: process.env.STRIPE_CURRENCY || 'usd',
        product_data: {
          name: item.name,
          description: item.description,
          images: item.imageUrl ? [item.imageUrl] : [],
        },
        unit_amount: item.unitPrice,
      },
      quantity: item.quantity,
    }));

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      ...(input.stripeCustomerId
        ? { customer: input.stripeCustomerId }
        : { customer_email: input.customerEmail }),
      line_items: lineItems,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { orderId: input.orderId, userId: input.userId, ...input.metadata },
      payment_intent_data: {
        metadata: { orderId: input.orderId },
      },
    };

    if (input.shippingAmount > 0) {
      params.shipping_options = [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: input.shippingAmount, currency: process.env.STRIPE_CURRENCY || 'usd' },
          display_name: 'Standard Shipping',
        },
      }];
    }

    const session = await this.stripe.checkout.sessions.create(params);
    return { sessionId: session.id, url: session.url! };
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || '',
    );
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });
  }
}
