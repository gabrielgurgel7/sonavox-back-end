// Storage port
export interface UploadResult {
  url: string;
  publicId: string;
}

export interface IStorageService {
  upload(file: Buffer, folder: string, filename?: string): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}

// Auth port
export interface IHashService {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  generateTokens(payload: object): TokenPair;
  verifyAccessToken(token: string): any;
  verifyRefreshToken(token: string): any;
}

// Payment port
export interface CreateCheckoutSessionInput {
  orderId: string;
  userId: string;
  customerEmail: string;
  stripeCustomerId?: string;
  items: Array<{
    name: string;
    description?: string;
    imageUrl?: string;
    unitPrice: number;
    quantity: number;
  }>;
  shippingAmount: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface IPaymentService {
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSession>;
  createCustomer(email: string, name: string): Promise<string>;
  constructWebhookEvent(payload: Buffer, signature: string): any;
  retrieveSession(sessionId: string): Promise<any>;
}
