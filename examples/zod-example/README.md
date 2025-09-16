# Zod Example - Open Swagger

This example demonstrates how to use Open Swagger with Zod schema validation in AdonisJS v6.

## Features

- ✅ Zod schema validation integration
- ✅ Automatic OpenAPI documentation generation
- ✅ Scalar UI for interactive API documentation
- ✅ Complete CRUD operations with validation
- ✅ Advanced Zod features (transformations, refinements, etc.)

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

### Posts API (`/api/v1/posts`)

- `GET /api/v1/posts` - Get all posts (with pagination and filtering)
- `GET /api/v1/posts/:id` - Get post by ID
- `POST /api/v1/posts` - Create new post
- `PUT /api/v1/posts/:id` - Update post
- `DELETE /api/v1/posts/:id` - Delete post

## Zod Schema Examples

### Post Schema

```typescript
const PostSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(5).max(200),
  content: z.string().min(20).max(5000),
  excerpt: z.string().min(10).max(300).optional(),
  authorId: z.number().int().positive(),
  published: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  tags: z.array(z.string()),
  metadata: z.object({
    views: z.number().int().min(0),
    likes: z.number().int().min(0),
    shares: z.number().int().min(0),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
```

### Create Post Schema

```typescript
const CreatePostSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(20).max(5000),
  excerpt: z.string().min(10).max(300).optional(),
  authorId: z.number().int().positive(),
  published: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})
```

## Decorator Usage

```typescript
@SwaggerInfo({
  tags: ['Posts'],
  summary: 'Create new post',
  description: 'Create a new blog post with Zod schema validation'
})
@SwaggerRequestBody('Post data', CreatePostSchema)
@SwaggerResponse(201, 'Post created successfully', PostSchema)
@SwaggerResponse(400, 'Validation error', ErrorSchema)
async store({ request, response }: HttpContext) {
  const data = request.all()
  // Implementation...
}
```

## Testing the API

### Create a new post:

```bash
curl -X POST http://localhost:3333/api/v1/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Zod",
    "content": "Zod is a TypeScript-first schema validation library that provides excellent type safety and runtime validation for your applications...",
    "excerpt": "Learn how to use Zod for schema validation",
    "authorId": 1,
    "published": true,
    "tags": ["typescript", "validation", "zod"]
  }'
```

### Get posts with filtering:

```bash
curl "http://localhost:3333/api/v1/posts?page=1&limit=10&published=true&author=1"
```

## Key Features Demonstrated

1. **Zod Integration**: Shows how Zod schemas are automatically converted to OpenAPI schemas
2. **Complex Validation**: Demonstrates string length validation, number constraints, and date formats
3. **Nested Objects**: Usage of nested object schemas with metadata
4. **Optional and Nullable**: Handling optional fields and nullable values
5. **Default Values**: Using Zod's default value functionality
6. **Type Safety**: Full TypeScript support with Zod type inference

## Zod Advanced Features

### String Validation

```typescript
// String with length constraints
title: z.string().min(5).max(200)

// Email validation
email: z.string().email()

// DateTime validation
createdAt: z.string().datetime()
```

### Number Validation

```typescript
// Integer with constraints
id: z.number().int().positive()

// Number with min/max
price: z.number().min(0).max(999999.99)
```

### Array and Object Validation

```typescript
// Array of strings
tags: z.array(z.string())

// Nested object
metadata: z.object({
  views: z.number().int().min(0),
  likes: z.number().int().min(0),
})
```

### Optional and Default Values

```typescript
// Optional field
excerpt: z.string().optional()

// Default value
published: z.boolean().default(false)

// Nullable field
publishedAt: z.string().datetime().nullable()
```

## Configuration

The Swagger configuration is located in `config/swagger.ts` and includes:

- Custom purple theme colors for Zod example
- Route scanning configuration
- API information and metadata
- Scalar UI customization

## Learn More

- [Zod Documentation](https://zod.dev/)
- [Adonis Open Swagger Documentation](https://github.com/devoresyah/adonis-open-swagger)
- [AdonisJS Documentation](https://adonisjs.com/)
