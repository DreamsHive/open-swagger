# TypeBox Example - Open Swagger

This example demonstrates how to use Open Swagger with TypeBox schema validation in AdonisJS v6.

## Features

- ✅ TypeBox schema validation integration
- ✅ Automatic OpenAPI documentation generation
- ✅ Scalar UI for interactive API documentation
- ✅ Complete CRUD operations with validation
- ✅ Advanced TypeBox features (constraints, formats, etc.)

## Getting Started

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Start the development server:**

   ```bash
   bun run dev
   ```

3. **Visit the API documentation:**
   Open your browser and navigate to: http://localhost:3333/docs

## API Endpoints

### Products API (`/api/v1/products`)

- `GET /api/v1/products` - Get all products (with pagination and filtering)
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create new product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

## TypeBox Schema Examples

### Product Schema

```typescript
const ProductSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  name: Type.String({ minLength: 2, maxLength: 100 }),
  description: Type.String({ minLength: 10, maxLength: 500 }),
  price: Type.Number({ minimum: 0 }),
  categoryId: Type.Integer({ minimum: 1 }),
  inStock: Type.Boolean(),
  tags: Type.Array(Type.String()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})
```

### Create Product Schema

```typescript
const CreateProductSchema = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 100 }),
  description: Type.String({ minLength: 10, maxLength: 500 }),
  price: Type.Number({ minimum: 0 }),
  categoryId: Type.Integer({ minimum: 1 }),
  inStock: Type.Optional(Type.Boolean()),
  tags: Type.Optional(Type.Array(Type.String())),
})
```

## Decorator Usage

### Enhanced Decorators

```typescript
import { SwaggerInfo, SwaggerParam, SwaggerHeader, SwaggerResponse, SwaggerRequestBody } from 'adonis-open-swagger'

// Query and path parameters
@SwaggerParam(
  {
    name: 'page',
    location: 'query',
    description: 'Page number for pagination'
  },
  Type.Optional(Type.Integer({ minimum: 1 }))
)

// Header parameters
@SwaggerHeader(
  {
    name: 'Authorization',
    description: 'Bearer token for authentication'
  },
  Type.String(),
  true // required
)

// Complete example
@SwaggerInfo({
  tags: ['Products'],
  summary: 'Create new product',
  description: 'Create a new product with TypeBox schema validation'
})
@SwaggerHeader(
  {
    name: 'Authorization',
    description: 'Bearer token for authentication'
  },
  Type.String(),
  true
)
@SwaggerRequestBody('Product data', CreateProductSchema)
@SwaggerResponse(201, 'Product created successfully', ProductSchema)
@SwaggerResponse(400, 'Validation error', ErrorSchema)
async store({ request, response }: HttpContext) {
  const data = request.all()
  // Implementation...
}
```

## Testing the API

### Create a new product:

```bash
curl -X POST http://localhost:3333/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Pro",
    "description": "High-performance laptop for professionals",
    "price": 1299.99,
    "categoryId": 1,
    "inStock": true,
    "tags": ["electronics", "computers", "professional"]
  }'
```

### Get products with filtering:

```bash
curl "http://localhost:3333/api/v1/products?page=1&limit=10&category=1"
```

## Key Features Demonstrated

1. **TypeBox Integration**: Shows how TypeBox schemas are automatically converted to OpenAPI schemas
2. **Advanced Constraints**: Demonstrates minimum/maximum values, string lengths, and formats
3. **Optional Fields**: Usage of `Type.Optional()` for optional properties
4. **Array Types**: Handling of array fields with TypeBox
5. **Type Safety**: Full TypeScript support with TypeBox type inference
6. **Error Schemas**: Structured error responses with TypeBox

## TypeBox Advanced Features

### Constraints and Formats

```typescript
// Number constraints
price: Type.Number({ minimum: 0, maximum: 999999.99 })

// String constraints and formats
email: Type.String({ format: 'email' })
createdAt: Type.String({ format: 'date-time' })

// Integer constraints
id: Type.Integer({ minimum: 1 })
```

### Optional and Nullable Types

```typescript
// Optional field
description: Type.Optional(Type.String())

// Nullable field
publishedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()])
```

## Configuration

The Swagger configuration is located in `config/swagger.ts` and includes:

- Custom blue theme colors for TypeBox example
- Route scanning configuration
- API information and metadata
- Scalar UI customization

## Learn More

- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Adonis Open Swagger Documentation](https://github.com/devoresyah/adonis-open-swagger)
- [AdonisJS Documentation](https://adonisjs.com/)
