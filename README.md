# E-Commerce API — Ports & Adapters Architecture

Node.js + TypeScript REST API following **Hexagonal Architecture** (Ports & Adapters).

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | PostgreSQL (via `pg`) |
| Auth | JWT (access + refresh tokens) + Bcrypt |
| Payments | Stripe Checkout |
| Storage | Cloudinary |
| Validation | Zod |

## Architecture Overview

```
src/
├── domain/                     # 🏛️ Core business logic (no dependencies)
│   ├── entities/               # User, Product, Category, Order
│   └── repositories/           # Interfaces (Ports)
│
├── application/                # 📋 Use cases & orchestration
│   ├── use-cases/              # Auth, Product, Category, Order, User
│   └── ports/                  # IStorageService, IPaymentService, IHashService...
│
├── infrastructure/             # 🔌 Adapters (implementations)
│   ├── database/postgres/      # PostgreSQL repositories + migrations
│   ├── auth/                   # JWT + Bcrypt implementations
│   ├── storage/                # Cloudinary adapter
│   ├── payment/                # Stripe adapter
│   └── http/                   # Express controllers, routes, middlewares
│
└── shared/                     # Errors, types, utils
```

## Getting Started

### 1. Setup environment
```bash
cp .env.example .env
# Fill in your secrets (Stripe, Cloudinary, JWT, DB)
```

### 2. Run with Docker
```bash
docker-compose up -d
npm run migrate
```

### 3. Or run locally
```bash
npm install
npm run migrate
npm run dev
```

## API Endpoints

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh` | Public |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/auth/me` | Authenticated |

### Products
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| POST | `/api/products` | ADMIN |
| PUT | `/api/products/:id` | ADMIN |
| DELETE | `/api/products/:id` | ADMIN |
| POST | `/api/products/:id/images` | ADMIN |
| DELETE | `/api/products/:id/images/:imageId` | ADMIN |

### Categories
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/categories` | Public |
| GET | `/api/categories/:id` | Public |
| POST | `/api/categories` | ADMIN |
| PUT | `/api/categories/:id` | ADMIN |
| DELETE | `/api/categories/:id` | ADMIN |

### Orders
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/orders` | ADMIN |
| GET | `/api/orders/my` | CUSTOMER |
| GET | `/api/orders/:id` | Owner or ADMIN |
| POST | `/api/orders/checkout` | CUSTOMER |
| PATCH | `/api/orders/:id/cancel` | Owner or ADMIN |
| PATCH | `/api/orders/:id/status` | ADMIN |
| POST | `/api/orders/webhook` | Stripe (no auth) |

### Users
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/users` | ADMIN |
| GET | `/api/users/:id` | Owner or ADMIN |
| PUT | `/api/users/profile` | Authenticated |
| DELETE | `/api/users/:id` | ADMIN |

## Checkout Flow

1. **Customer** calls `POST /api/orders/checkout` with cart items + shipping address
2. API creates Order in DB with status `PENDING`
3. API creates Stripe Checkout Session
4. Response includes `checkoutUrl` → redirect user to Stripe
5. On success, Stripe sends `checkout.session.completed` webhook
6. Webhook handler marks Order as `PAID` and decrements stock
7. On expiry, order is cancelled automatically

## Roles

- **ADMIN**: Full access to all resources
- **CUSTOMER**: Can browse products, place orders, manage own profile

## Stripe Webhook Setup

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/orders/webhook
```

Set `STRIPE_WEBHOOK_SECRET` from the CLI output.
# sonavox-back-end
