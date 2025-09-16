# VineJS Example - Open Swagger

This example demonstrates how to use Open Swagger with VineJS schema validation in AdonisJS v6.

## Features

- ✅ VineJS schema validation integration
- ✅ Automatic OpenAPI documentation generation
- ✅ Scalar UI for interactive API documentation
- ✅ Complete CRUD operations with validation
- ✅ Custom error handling and responses

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

### Users API (`/api/v1/users`)

- `GET /api/v1/users` - Get all users (with pagination)
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## VineJS Schema Examples

### User Schema

```typescript
const UserSchema = vine.object({
  id: vine.number().positive(),
  name: vine.string().minLength(2).maxLength(50),
  email: vine.string().email(),
  age: vine.number().min(18).max(120).optional(),
  createdAt: vine.date(),
  updatedAt: vine.date(),
})
```

### Create User Schema

```typescript
const CreateUserSchema = vine.object({
  name: vine.string().minLength(2).maxLength(50),
  email: vine.string().email(),
  age: vine.number().min(18).max(120).optional(),
})
```

## Decorator Usage

```typescript
@SwaggerInfo({
  tags: ['Users'],
  summary: 'Create new user',
  description: 'Create a new user with VineJS schema validation'
})
@SwaggerRequestBody('User data', CreateUserSchema)
@SwaggerResponse(201, 'User created successfully', UserSchema)
@SwaggerResponse(400, 'Validation error')
async store({ request, response }: HttpContext) {
  const data = await request.validateUsing(CreateUserSchema)
  // Implementation...
}
```

## Testing the API

### Create a new user:

```bash
curl -X POST http://localhost:3333/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

### Get all users:

```bash
curl http://localhost:3333/api/v1/users?page=1&limit=10
```

## Key Features Demonstrated

1. **VineJS Integration**: Shows how VineJS schemas are automatically converted to OpenAPI schemas
2. **Validation**: Request validation using VineJS with automatic error responses
3. **Documentation**: Comprehensive API documentation with examples
4. **Type Safety**: Full TypeScript support with VineJS type inference
5. **Custom Styling**: Example-specific Scalar UI theming

## Configuration

The Swagger configuration is located in `config/swagger.ts` and includes:

- Custom theme colors for VineJS example
- Route scanning configuration
- API information and metadata
- Scalar UI customization

## Learn More

- [VineJS Documentation](https://vinejs.dev/)
- [Open Swagger Documentation](https://github.com/DreamsHive/open-swagger)
- [AdonisJS Documentation](https://adonisjs.com/)
