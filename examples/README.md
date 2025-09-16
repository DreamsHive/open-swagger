# Open Swagger Examples

This directory contains example AdonisJS v6 applications demonstrating how to use Open Swagger with different schema validation libraries.

## Available Examples

### 1. VineJS Example (`vinejs-example/`)

Demonstrates Open Swagger integration with VineJS schema validation.

**Features:**

- User management API with CRUD operations
- VineJS schema validation and documentation
- Custom green theme for Scalar UI
- Request validation using VineJS

**API Endpoints:** `/api/v1/users`

### 2. TypeBox Example (`typebox-example/`)

Demonstrates Open Swagger integration with TypeBox schema validation.

**Features:**

- Product management API with CRUD operations
- TypeBox schema validation and documentation
- Custom blue theme for Scalar UI
- Advanced TypeBox constraints and formats

**API Endpoints:** `/api/v1/products`

### 3. Zod Example (`zod-example/`)

Demonstrates Open Swagger integration with Zod schema validation.

**Features:**

- Blog post management API with CRUD operations
- Zod schema validation and documentation
- Custom purple theme for Scalar UI
- Complex nested object validation

**API Endpoints:** `/api/v1/posts`

## Quick Start

1. **Choose an example** and navigate to its directory:

   ```bash
   cd vinejs-example    # or typebox-example, or zod-example
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Start the development server:**

   ```bash
   bun run dev
   ```

4. **View the API documentation:**
   Open http://localhost:3333/docs in your browser

## Common Features

All examples demonstrate:

- ✅ **Automatic OpenAPI Generation**: Routes are automatically documented
- ✅ **Scalar UI Integration**: Modern, interactive API documentation
- ✅ **Schema Validation**: Request/response validation with respective libraries
- ✅ **Decorator-driven Documentation**: Use decorators to enhance documentation
- ✅ **TypeScript Support**: Full type safety and IntelliSense
- ✅ **Custom Theming**: Example-specific Scalar UI themes

## Decorator Usage

All examples use the same set of Open Swagger decorators:

```typescript
import {
  SwaggerInfo,
  SwaggerResponse,
  SwaggerRequestBody,
  SwaggerParam,
} from 'open-swagger'

@SwaggerInfo({
  tags: ['Users'],
  summary: 'Create new user',
  description: 'Create a new user with validation'
})
@SwaggerRequestBody('User data', CreateUserSchema)
@SwaggerResponse(201, 'User created successfully', UserSchema)
@SwaggerResponse(400, 'Validation error')
async store({ request, response }: HttpContext) {
  // Implementation
}
```

## Schema Library Comparison

| Feature                  | VineJS    | TypeBox   | Zod       |
| ------------------------ | --------- | --------- | --------- |
| **Type Safety**          | ✅        | ✅        | ✅        |
| **Runtime Validation**   | ✅        | ✅        | ✅        |
| **AdonisJS Integration** | ✅ Native | ✅        | ✅        |
| **Bundle Size**          | Small     | Small     | Medium    |
| **Learning Curve**       | Easy      | Medium    | Easy      |
| **Advanced Features**    | Good      | Excellent | Excellent |

## Testing the APIs

Each example includes different endpoints for testing:

### VineJS Example - Users API

```bash
# Get all users
curl http://localhost:3333/api/v1/users

# Create a user
curl -X POST http://localhost:3333/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "age": 30}'
```

### TypeBox Example - Products API

```bash
# Get all products
curl http://localhost:3333/api/v1/products

# Create a product
curl -X POST http://localhost:3333/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop", "description": "High-performance laptop", "price": 1299.99, "categoryId": 1}'
```

### Zod Example - Posts API

```bash
# Get all posts
curl http://localhost:3333/api/v1/posts

# Create a post
curl -X POST http://localhost:3333/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My Post", "content": "This is a great post about Zod validation", "authorId": 1}'
```

## Configuration

Each example has its own `config/swagger.ts` file with:

- Custom API information
- Example-specific theming
- Route scanning configuration
- Scalar UI customization

## Learn More

- [Open Swagger Documentation](https://github.com/DreamsHive/open-swagger)
- [VineJS Documentation](https://vinejs.dev/)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- [Zod Documentation](https://zod.dev/)
- [AdonisJS Documentation](https://adonisjs.com/)

## Contributing

Feel free to improve these examples or add new ones demonstrating additional features!
