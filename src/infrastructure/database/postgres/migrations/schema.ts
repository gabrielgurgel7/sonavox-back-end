export const migrations = [
  {
    name: '001_create_users',
    up: `
      CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'CUSTOMER',
        avatar_url TEXT,
        stripe_customer_id VARCHAR(255),
        refresh_token TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_users_email ON users(email);
    `,
    down: `DROP TABLE IF EXISTS users; DROP TYPE IF EXISTS user_role;`,
  },
  {
    name: '002_create_categories',
    up: `
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        image_url TEXT,
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_categories_slug ON categories(slug);
    `,
    down: `DROP TABLE IF EXISTS categories;`,
  },
  {
    name: '003_create_products',
    up: `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        compare_at_price DECIMAL(10,2),
        stock INTEGER NOT NULL DEFAULT 0,
        sku VARCHAR(255) UNIQUE NOT NULL,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        stripe_product_id VARCHAR(255),
        stripe_price_id VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        public_id VARCHAR(255) NOT NULL,
        is_main BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_products_slug ON products(slug);
      CREATE INDEX idx_products_sku ON products(sku);
      CREATE INDEX idx_products_category ON products(category_id);
      CREATE INDEX idx_product_images_product ON product_images(product_id);
    `,
    down: `DROP TABLE IF EXISTS product_images; DROP TABLE IF EXISTS products;`,
  },
  {
    name: '004_create_orders',
    up: `
      CREATE TYPE order_status AS ENUM (
        'PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
      );

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        status order_status NOT NULL DEFAULT 'PENDING',
        subtotal DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) NOT NULL DEFAULT 0,
        shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        shipping_address JSONB NOT NULL,
        stripe_payment_intent_id VARCHAR(255),
        stripe_session_id VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        product_name VARCHAR(255) NOT NULL,
        product_image TEXT,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL
      );

      CREATE INDEX idx_orders_user ON orders(user_id);
      CREATE INDEX idx_orders_status ON orders(status);
      CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);
      CREATE INDEX idx_order_items_order ON order_items(order_id);
    `,
    down: `DROP TABLE IF EXISTS order_items; DROP TABLE IF EXISTS orders; DROP TYPE IF EXISTS order_status;`,
  },
  {
    name: '005_create_migrations_table',
    up: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    down: `DROP TABLE IF EXISTS schema_migrations;`,
  },
];
