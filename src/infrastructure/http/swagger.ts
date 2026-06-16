import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: `
REST API built with Node.js + TypeScript using **Ports & Adapters** (Hexagonal) architecture.

### Features
- JWT Authentication (access + refresh tokens)
- Role-based access control: **ADMIN** and **CUSTOMER**
- Stripe Checkout integration
- Cloudinary image uploads
- PostgreSQL with raw SQL

### Authentication
Use the \`/auth/login\` endpoint to get tokens, then click **Authorize** and paste your \`accessToken\`.
      `,
      contact: { name: "E-Commerce API", email: "dev@example.com" },
      license: { name: "MIT" },
    },
    servers: [
      { url: "http://localhost:3000/api", description: "Development" },
      { url: "https://your-api.com/api", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your access token",
        },
      },
      schemas: {
        // ---- Shared ----
        PaginationMeta: {
          type: "object",
          properties: {
            total: { type: "integer", example: 100 },
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            totalPages: { type: "integer", example: 5 },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
          },
        },

        // ---- Auth ----
        RegisterInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", minLength: 8, example: "secret123" },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: { type: "string", example: "secret123" },
          },
        },
        Tokens: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            refreshToken: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            tokens: { $ref: "#/components/schemas/Tokens" },
          },
        },

        // ---- User ----
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            },
            name: { type: "string", example: "John Doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            role: {
              type: "string",
              enum: ["ADMIN", "CUSTOMER"],
              example: "CUSTOMER",
            },
            avatarUrl: {
              type: "string",
              format: "uri",
              nullable: true,
              example: "https://res.cloudinary.com/...",
            },
            stripeCustomerId: {
              type: "string",
              nullable: true,
              example: "cus_abc123",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        UpdateProfileInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 2, example: "John Doe" },
          },
        },

        // ---- Category ----
        Category: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Electronics" },
            slug: { type: "string", example: "electronics" },
            description: {
              type: "string",
              nullable: true,
              example: "Electronic devices and accessories",
            },
            imageUrl: {
              type: "string",
              nullable: true,
              example: "https://res.cloudinary.com/...",
            },
            parentId: { type: "string", format: "uuid", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateCategoryInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Electronics" },
            description: { type: "string", example: "Electronic devices" },
            parentId: { type: "string", format: "uuid", nullable: true },
          },
        },

        // ---- Product ----
        ProductImage: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            url: { type: "string", format: "uri" },
            publicId: { type: "string" },
            isMain: { type: "boolean" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "iPhone 15 Pro" },
            slug: { type: "string", example: "iphone-15-pro" },
            description: { type: "string", example: "Latest Apple smartphone" },
            price: { type: "number", format: "float", example: 999.99 },
            compareAtPrice: {
              type: "number",
              format: "float",
              nullable: true,
              example: 1199.99,
            },
            stock: { type: "integer", example: 50 },
            sku: { type: "string", example: "IPH-15-PRO-256" },
            categoryId: { type: "string", format: "uuid" },
            images: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductImage" },
            },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateProductInput: {
          type: "object",
          required: [
            "name",
            "description",
            "price",
            "stock",
            "sku",
            "categoryId",
          ],
          properties: {
            name: { type: "string", example: "iPhone 15 Pro" },
            description: {
              type: "string",
              example: "Latest Apple smartphone with titanium design",
            },
            price: { type: "number", example: 999.99 },
            compareAtPrice: {
              type: "number",
              example: 1199.99,
              nullable: true,
            },
            stock: { type: "integer", example: 50 },
            sku: { type: "string", example: "IPH-15-PRO-256" },
            categoryId: { type: "string", format: "uuid" },
          },
        },

        // ---- Order ----
        ShippingAddress: {
          type: "object",
          required: [
            "street",
            "number",
            "neighborhood",
            "city",
            "state",
            "country",
            "zipCode",
          ],
          properties: {
            street: { type: "string", example: "Rua das Flores" },
            number: { type: "string", example: "123" },
            complement: { type: "string", nullable: true, example: "Apto 4B" },
            neighborhood: { type: "string", example: "Centro" },
            city: { type: "string", example: "Fortaleza" },
            state: { type: "string", example: "CE" },
            country: { type: "string", example: "BR" },
            zipCode: { type: "string", example: "60000-000" },
          },
        },
        OrderItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            productId: { type: "string", format: "uuid" },
            productName: { type: "string", example: "iPhone 15 Pro" },
            productImage: { type: "string", nullable: true },
            quantity: { type: "integer", example: 2 },
            unitPrice: { type: "number", example: 999.99 },
            totalPrice: { type: "number", example: 1999.98 },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            items: {
              type: "array",
              items: { $ref: "#/components/schemas/OrderItem" },
            },
            status: {
              type: "string",
              enum: [
                "PENDING",
                "PROCESSING",
                "PAID",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED",
                "REFUNDED",
              ],
              example: "PENDING",
            },
            subtotal: { type: "number", example: 999.99 },
            discount: { type: "number", example: 0 },
            shipping: { type: "number", example: 9.99 },
            total: { type: "number", example: 1009.98 },
            shippingAddress: { $ref: "#/components/schemas/ShippingAddress" },
            stripeSessionId: { type: "string", nullable: true },
            stripePaymentIntentId: { type: "string", nullable: true },
            notes: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CheckoutInput: {
          type: "object",
          required: ["items", "shippingAddress", "successUrl", "cancelUrl"],
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["productId", "quantity"],
                properties: {
                  productId: { type: "string", format: "uuid" },
                  quantity: { type: "integer", minimum: 1, example: 2 },
                },
              },
            },
            shippingAddress: { $ref: "#/components/schemas/ShippingAddress" },
            notes: { type: "string", nullable: true },
            successUrl: {
              type: "string",
              format: "uri",
              example: "https://myapp.com/checkout/success",
            },
            cancelUrl: {
              type: "string",
              format: "uri",
              example: "https://myapp.com/checkout/cancel",
            },
          },
        },
        CheckoutResponse: {
          type: "object",
          properties: {
            order: { $ref: "#/components/schemas/Order" },
            checkoutUrl: {
              type: "string",
              format: "uri",
              example: "https://checkout.stripe.com/...",
            },
          },
        },
      },

      // ---- Reusable parameters ----
      parameters: {
        PageParam: {
          name: "page",
          in: "query",
          schema: { type: "integer", default: 1 },
          description: "Page number",
        },
        LimitParam: {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 20 },
          description: "Items per page",
        },
        SearchParam: {
          name: "search",
          in: "query",
          schema: { type: "string" },
          description: "Search term",
        },
        IdParam: {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Resource ID",
        },
      },

      // ---- Reusable responses ----
      responses: {
        Unauthorized: {
          description: "Unauthorized — missing or invalid token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        Forbidden: {
          description: "Forbidden — insufficient permissions",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },

    // ============================================================
    // PATHS
    // ============================================================
    paths: {
      // ---- AUTH ----
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterInput" },
              },
            },
          },
          responses: {
            201: {
              description: "User registered",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/AuthResponse" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            409: {
              description: "Email already in use",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            422: { $ref: "#/components/responses/ValidationError" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and receive tokens",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginInput" },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/AuthResponse" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["refreshToken"],
                  properties: { refreshToken: { type: "string" } },
                },
              },
            },
          },
          responses: {
            200: {
              description: "New tokens",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: {
                            properties: {
                              tokens: { $ref: "#/components/schemas/Tokens" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout (invalidate refresh token)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Logged out successfully" },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get current user from token",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Current user payload from JWT" },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },

      // ---- USERS ----
      "/users": {
        get: {
          tags: ["Users"],
          summary: "List all users (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/PageParam" },
            { $ref: "#/components/parameters/LimitParam" },
            { $ref: "#/components/parameters/SearchParam" },
          ],
          responses: {
            200: { description: "Paginated users list" },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/users/profile": {
        put: {
          tags: ["Users"],
          summary: "Update own profile (name + optional avatar)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string" },
                    avatar: {
                      type: "string",
                      format: "binary",
                      description: "Avatar image (max 5MB)",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Profile updated",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/User" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get user by ID (own profile or ADMIN)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            200: {
              description: "User found",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/User" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          tags: ["Users"],
          summary: "Delete user (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            200: { description: "User deleted" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      // ---- CATEGORIES ----
      "/categories": {
        get: {
          tags: ["Categories"],
          summary: "List all categories",
          parameters: [
            { $ref: "#/components/parameters/PageParam" },
            { $ref: "#/components/parameters/LimitParam" },
            { $ref: "#/components/parameters/SearchParam" },
          ],
          responses: {
            200: {
              description: "Paginated categories list",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/PaginationMeta" }, // Traz total, page, limit...
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Category" },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Categories"],
          summary: "Create category (ADMIN only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", example: "Electronics" },
                    description: { type: "string" },
                    parentId: { type: "string", format: "uuid" },
                    image: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Category created",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/Category" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            409: { description: "Category name already exists" },
          },
        },
      },
      "/categories/{id}": {
        get: {
          tags: ["Categories"],
          summary: "Get category by ID",
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            200: {
              description: "Category found",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/Category" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Categories"],
          summary: "Update category (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateCategoryInput" },
              },
            },
          },
          responses: {
            200: { description: "Category updated" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          tags: ["Categories"],
          summary: "Delete category (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            200: { description: "Category deleted" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      // ---- PRODUCTS ----
      "/products": {
        get: {
          tags: ["Products"],
          summary: "List products with filters",
          parameters: [
            { $ref: "#/components/parameters/PageParam" },
            { $ref: "#/components/parameters/LimitParam" },
            { $ref: "#/components/parameters/SearchParam" },
            {
              name: "categoryId",
              in: "query",
              schema: { type: "string", format: "uuid" },
              description: "Filter by category",
            },
            {
              name: "minPrice",
              in: "query",
              schema: { type: "number" },
              description: "Minimum price",
            },
            {
              name: "maxPrice",
              in: "query",
              schema: { type: "number" },
              description: "Maximum price",
            },
            {
              name: "isActive",
              in: "query",
              schema: { type: "boolean", default: true },
              description: "Filter by active status",
            },
          ],
          responses: {
            200: {
              description: "Paginated products list",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: {
                            properties: {
                              data: {
                                type: "array",
                                items: { $ref: "#/components/schemas/Product" },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Products"],
          summary: "Create product (ADMIN only)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateProductInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Product created",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/Product" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            409: { description: "SKU already in use" },
          },
        },
      },
      "/products/{id}": {
        get: {
          tags: ["Products"],
          summary: "Get product by ID",
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            200: {
              description: "Product found",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/Product" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
        put: {
          tags: ["Products"],
          summary: "Update product (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateProductInput" },
              },
            },
          },
          responses: {
            200: { description: "Product updated" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          tags: ["Products"],
          summary: "Delete product (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            200: { description: "Product deleted" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/products/{id}/images": {
        post: {
          tags: ["Products"],
          summary: "Upload product image to Cloudinary (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["image"],
                  properties: {
                    image: {
                      type: "string",
                      format: "binary",
                      description: "Image file (max 5MB)",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Image uploaded",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/ProductImage" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: { description: "No file uploaded" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/products/{id}/images/{imageId}": {
        delete: {
          tags: ["Products"],
          summary: "Delete product image from Cloudinary (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/IdParam" },
            {
              name: "imageId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Image ID",
            },
          ],
          responses: {
            200: { description: "Image deleted" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },

      // ---- ORDERS ----
      "/orders": {
        get: {
          tags: ["Orders"],
          summary: "List all orders (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/PageParam" },
            { $ref: "#/components/parameters/LimitParam" },
            {
              name: "userId",
              in: "query",
              schema: { type: "string", format: "uuid" },
              description: "Filter by user",
            },
            {
              name: "status",
              in: "query",
              schema: {
                type: "string",
                enum: [
                  "PENDING",
                  "PROCESSING",
                  "PAID",
                  "SHIPPED",
                  "DELIVERED",
                  "CANCELLED",
                  "REFUNDED",
                ],
              },
            },
          ],
          responses: {
            200: { description: "Paginated orders list" },
            403: { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/orders/my": {
        get: {
          tags: ["Orders"],
          summary: "Get own orders",
          security: [{ bearerAuth: [] }],
          parameters: [
            { $ref: "#/components/parameters/PageParam" },
            { $ref: "#/components/parameters/LimitParam" },
          ],
          responses: {
            200: {
              description: "My orders",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: {
                            properties: {
                              data: {
                                type: "array",
                                items: { $ref: "#/components/schemas/Order" },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/orders/checkout": {
        post: {
          tags: ["Orders"],
          summary: "Create order and get Stripe Checkout URL",
          description: `
Creates an order in PENDING state and returns a Stripe Checkout URL.

**Flow:**
1. Call this endpoint with cart items and shipping address
2. Redirect the user to \`checkoutUrl\`
3. After payment, Stripe fires a webhook to \`/orders/webhook\`
4. Order status changes to \`PAID\` and stock is decremented automatically
          `,
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CheckoutInput" },
              },
            },
          },
          responses: {
            201: {
              description: "Checkout session created",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: {
                            $ref: "#/components/schemas/CheckoutResponse",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            422: { description: "Insufficient stock or inactive product" },
          },
        },
      },
      "/orders/webhook": {
        post: {
          tags: ["Orders"],
          summary: "Stripe webhook (called by Stripe, not by clients)",
          description:
            "Handles `checkout.session.completed` and `checkout.session.expired` events. Requires raw body — do NOT call this from your frontend.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } },
          },
          parameters: [
            {
              name: "stripe-signature",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Webhook received" },
            400: { description: "Invalid signature" },
          },
        },
      },
      "/orders/{id}": {
        get: {
          tags: ["Orders"],
          summary: "Get order by ID (owner or ADMIN)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            200: {
              description: "Order found",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/Order" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/orders/{id}/cancel": {
        patch: {
          tags: ["Orders"],
          summary: "Cancel order (owner or ADMIN, only PENDING/PROCESSING)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          responses: {
            200: {
              description: "Order cancelled",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessResponse" },
                      {
                        properties: {
                          data: { $ref: "#/components/schemas/Order" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: { description: "Order cannot be cancelled at this stage" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/orders/{id}/status": {
        patch: {
          tags: ["Orders"],
          summary: "Update order status (ADMIN only)",
          security: [{ bearerAuth: [] }],
          parameters: [{ $ref: "#/components/parameters/IdParam" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: {
                      type: "string",
                      enum: [
                        "PENDING",
                        "PROCESSING",
                        "PAID",
                        "SHIPPED",
                        "DELIVERED",
                        "CANCELLED",
                        "REFUNDED",
                      ],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Status updated" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
          },
        },
      },
    },

    tags: [
      { name: "Auth", description: "Registration, login, token management" },
      { name: "Users", description: "User management and profiles" },
      { name: "Categories", description: "Product categories" },
      { name: "Products", description: "Product catalog and images" },
      { name: "Orders", description: "Orders and Stripe checkout" },
    ],
  },
  apis: [], // We define everything inline above
};

export const swaggerSpec = swaggerJsdoc(options);
