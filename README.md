# 🎵 Sonavox API — Backend

REST API para o e-commerce Sonavox, construída com arquitetura **Hexagonal (Ports & Adapters)**.

🔗 **[Frontend ao vivo](https://sonavox-front-end.vercel.app)**

---

## 🚀 Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Banco de dados | PostgreSQL (via `pg`) |
| Autenticação | JWT (access + refresh tokens) + Bcrypt |
| Pagamentos | Stripe Checkout |
| Storage | Cloudinary |
| Validação | Zod |
| Documentação | Swagger UI |

---

## 🏛️ Arquitetura

```
src/
├── domain/                     # Core business logic (sem dependências externas)
│   ├── entities/               # User, Product, Category, Order
│   └── repositories/           # Interfaces (Ports)
│
├── application/                # Use cases & orquestração
│   ├── use-cases/              # Auth, Product, Category, Order, User
│   └── ports/                  # IStorageService, IPaymentService, IHashService
│
├── infrastructure/             # Adapters (implementações)
│   ├── database/postgres/      # Repositórios PostgreSQL + migrations
│   ├── auth/                   # JWT + Bcrypt
│   ├── storage/                # Cloudinary adapter
│   ├── payment/                # Stripe adapter
│   └── http/                   # Express controllers, routes, middlewares
│
└── shared/                     # Erros, tipos, utils
```

---

## 🖥️ Rodando localmente

### Pré-requisitos
- Node.js 18+
- Docker

### Instalação

```bash
# Clone o repositório
git clone https://github.com/gabrielgurgel7/sonavox-back-end.git
cd sonavox-back-end

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações
```

### Variáveis de ambiente

```env
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5430
DB_NAME=ecommerce_db
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=brl

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ALLOWED_ORIGINS=http://localhost:5173
```

### Rodando

```bash
# Sobe o banco com Docker
docker-compose up -d

# Roda as migrations
npm run migrate

# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

---

## 📡 Endpoints

### Auth
| Método | Endpoint | Acesso |
|--------|----------|--------|
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/refresh` | Público |
| POST | `/api/auth/logout` | Autenticado |
| GET | `/api/auth/me` | Autenticado |

### Produtos
| Método | Endpoint | Acesso |
|--------|----------|--------|
| GET | `/api/products` | Público |
| GET | `/api/products/:id` | Público |
| POST | `/api/products` | ADMIN |
| PUT | `/api/products/:id` | ADMIN |
| DELETE | `/api/products/:id` | ADMIN |
| POST | `/api/products/:id/images` | ADMIN |
| DELETE | `/api/products/:id/images/:imageId` | ADMIN |

### Categorias
| Método | Endpoint | Acesso |
|--------|----------|--------|
| GET | `/api/categories` | Público |
| GET | `/api/categories/:id` | Público |
| POST | `/api/categories` | ADMIN |
| PUT | `/api/categories/:id` | ADMIN |
| DELETE | `/api/categories/:id` | ADMIN |

### Pedidos
| Método | Endpoint | Acesso |
|--------|----------|--------|
| GET | `/api/orders` | ADMIN |
| GET | `/api/orders/my` | CUSTOMER |
| GET | `/api/orders/:id` | Dono ou ADMIN |
| POST | `/api/orders/checkout` | CUSTOMER |
| PATCH | `/api/orders/:id/cancel` | Dono ou ADMIN |
| PATCH | `/api/orders/:id/status` | ADMIN |
| POST | `/api/orders/webhook` | Stripe |

### Usuários
| Método | Endpoint | Acesso |
|--------|----------|--------|
| GET | `/api/users` | ADMIN |
| GET | `/api/users/:id` | Dono ou ADMIN |
| PUT | `/api/users/profile` | Autenticado |
| DELETE | `/api/users/:id` | ADMIN |

---

## 💳 Fluxo de Checkout

1. Cliente chama `POST /api/orders/checkout` com itens e endereço
2. API cria o pedido no banco com status `PENDING`
3. API cria uma Stripe Checkout Session
4. Resposta retorna `checkoutUrl` → frontend redireciona para o Stripe
5. Após pagamento, Stripe envia webhook `checkout.session.completed`
6. Webhook marca o pedido como `PAID` e decrementa o estoque
7. Em caso de expiração, pedido é cancelado automaticamente

---

## 🔑 Roles

- **ADMIN** — acesso completo a todos os recursos
- **CUSTOMER** — pode navegar, fazer pedidos e gerenciar o próprio perfil

---

## 🌐 Deploy

| Serviço | Plataforma |
|---------|-----------|
| API | Railway |
| Banco de dados | Railway PostgreSQL |
| Imagens | Cloudinary |
| Pagamentos | Stripe |
