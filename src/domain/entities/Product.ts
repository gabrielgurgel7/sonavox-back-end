export interface ProductImage {
  id: string;
  url: string;
  publicId: string;
  isMain: boolean;
}

export interface ProductProps {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  categoryId: string;
  images: ProductImage[];
  isActive: boolean;
  stripePriceId?: string;
  stripeProductId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private props: ProductProps;

  constructor(props: ProductProps) {
    this.props = props;
  }

  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get slug() {
    return this.props.slug;
  }
  get description() {
    return this.props.description;
  }
  get price() {
    return this.props.price;
  }
  get compareAtPrice() {
    return this.props.compareAtPrice;
  }
  get stock() {
    return this.props.stock;
  }
  get sku() {
    return this.props.sku;
  }
  get categoryId() {
    return this.props.categoryId;
  }
  get images() {
    return this.props.images;
  }
  get isActive() {
    return this.props.isActive;
  }
  get stripePriceId() {
    return this.props.stripePriceId;
  }
  get stripeProductId() {
    return this.props.stripeProductId;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  get mainImage(): ProductImage | undefined {
    return this.props.images.find((img) => img.isMain) ?? this.props.images[0];
  }

  hasStock(quantity: number): boolean {
    return this.props.stock >= quantity;
  }

  decreaseStock(quantity: number): void {
    if (!this.hasStock(quantity)) throw new Error("Insufficient stock");
    this.props.stock -= quantity;
    this.props.updatedAt = new Date();
  }

  increaseStock(quantity: number): void {
    this.props.stock += quantity;
    this.props.updatedAt = new Date();
  }

  updateStripeIds(productId: string, priceId: string): void {
    this.props.stripeProductId = productId;
    this.props.stripePriceId = priceId;
    this.props.updatedAt = new Date();
  }

  addImage(image: ProductImage): void {
    if (this.props.images.length === 0) image.isMain = true;
    this.props.images.push(image);
    this.props.updatedAt = new Date();
  }

  removeImage(imageId: string): void {
    const wasMain = this.props.images.find((i) => i.id === imageId)?.isMain;
    this.props.images = this.props.images.filter((i) => i.id !== imageId);
    if (wasMain && this.props.images.length > 0) {
      this.props.images[0].isMain = true;
    }
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  update(
    input: Partial<{
      name: string;
      description: string;
      price: number;
      compareAtPrice: number;
      stock: number;
      sku: string;
      categoryId: string;
    }>,
  ): void {
    if (input.name !== undefined) this.props.name = input.name;
    if (input.description !== undefined)
      this.props.description = input.description;
    if (input.price !== undefined) this.props.price = input.price;
    if (input.compareAtPrice !== undefined)
      this.props.compareAtPrice = input.compareAtPrice;
    if (input.stock !== undefined) this.props.stock = input.stock;
    if (input.sku !== undefined) this.props.sku = input.sku;
    if (input.categoryId !== undefined)
      this.props.categoryId = input.categoryId;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return { ...this.props };
  }
}
