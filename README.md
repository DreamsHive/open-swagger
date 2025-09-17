# Adonis Open Swagger

Modern Swagger/OpenAPI integration for AdonisJS v6 with Scalar UI.

## Features

- 🚀 **Modern UI**: Uses Scalar instead of traditional Swagger UI
- 🎯 **Decorator-driven**: Documentation only generated for routes with explicit decorators
- 🔧 **Schema Support**: Native TypeBox, Zod, and VineJS schema support alongside raw JSON Schema
- 🎨 **Customizable**: Flexible configuration and theming options
- 🛠️ **CLI Integration**: Seamless integration with AdonisJS Ace commands
- 📦 **TypeScript**: Full TypeScript support with proper type definitions
- ⚡ **Dynamic Loading**: Leverages AdonisJS v6's lazy loading for optimal performance

## Installation

```bash
# Core package (required)
node ace add adonis-open-swagger

# Edge template engine (required for documentation UI)
node ace add edge

# Optional: Install schema libraries based on your preference
npm install @sinclair/typebox  # For TypeBox schemas
npm install zod                # For Zod schemas
npm install @vinejs/vine       # For VineJS schemas (recommended for AdonisJS)
```

### Requirements

- **Edge.js**: Required for rendering the documentation UI. If you're using the **Web starter kit**, Edge is already included. For **API**, **Slim**, or **Inertia** starter kits, you'll need to install it manually.
- **Schema libraries**: Optional dependencies based on your validation needs.

> **Note**: TypeBox, Zod v4+, and VineJS are optional dependencies. The package will work with raw JSON Schema even if these libraries are not installed. Schema conversion will gracefully fallback if the libraries are missing.

## Setup

### 1. Configure the package

Configure the package in your AdonisJS application:

```bash
node ace configure adonis-open-swagger
```

This will:

- Register the service provider
- Create a `config/swagger.ts` configuration file
- Add example routes in `start/swagger_routes.ts`
- Register Ace commands

## Usage

After configuration, your API documentation will be available at `/docs` (configurable).

> **Important**: This package uses a decorator-driven approach. Only routes with explicit decorators will appear in the documentation. Routes without decorators will not be documented.

### Basic Configuration

The package creates a `config/swagger.ts` file:

```typescript
import { defineConfig } from 'adonis-open-swagger'

export default defineConfig({
  enabled: true,
  path: '/docs',
  validator: 'vinejs', // or 'zod', 'typebox'
  info: {
    title: 'My API',
    version: '1.0.0',
    description: 'API documentation for my application',
  },
  scalar: {
    theme: 'auto', // 'auto' | 'default' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'deepSpace' | 'laserwave' | 'elysiajs' | 'none'
    layout: 'modern', // 'modern' or 'classic'
  },
  routes: {
    include: ['/api/*'],
    exclude: ['/docs*', '/health*'],
  },
})
```

### Using Decorators with TypeBox, Zod, and VineJS

Enhance your controllers with documentation decorators using TypeBox, Zod, VineJS, or raw JSON Schema:

```typescript
import { HttpContext } from '@adonisjs/core/http'
import { Type } from '@sinclair/typebox'
import { z } from 'zod'
import vine from '@vinejs/vine'
import { SwaggerInfo, SwaggerResponse, SwaggerRequestBody, SwaggerParam } from 'adonis-open-swagger'

// TypeBox schemas
const UserSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  createdAt: Type.String({ format: 'date-time' }),
})

const UserListResponseSchema = Type.Object({
  data: Type.Array(UserSchema),
  meta: Type.Object({
    total: Type.Integer(),
    page: Type.Integer(),
    limit: Type.Integer(),
  }),
})

// Zod schemas
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
})

// VineJS schemas (recommended for AdonisJS v6)
const UpdateUserSchema = vine.object({
  name: vine.string().minLength(2).maxLength(100).optional(),
  email: vine.string().email().optional(),
})

export default class UsersController {
  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Get all users',
    description: 'Retrieve a paginated list of users',
  })
  @SwaggerParam(
    {
      name: 'page',
      location: 'query',
      description: 'Page number',
    },
    Type.Integer({ minimum: 1 })
  )
  @SwaggerParam(
    {
      name: 'limit',
      location: 'query',
      description: 'Items per page',
    },
    Type.Integer({ minimum: 1, maximum: 100 })
  )
  @SwaggerResponse(200, 'Users retrieved successfully', UserListResponseSchema)
  async index({ request, response }: HttpContext) {
    // Your implementation
  }

  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Create new user',
    description: 'Create a new user with validation',
  })
  @SwaggerRequestBody('User data', CreateUserSchema) // Using Zod schema
  @SwaggerResponse(201, 'User created successfully', UserSchema) // Using TypeBox schema
  @SwaggerResponse(400, 'Validation error')
  async store({ request, response }: HttpContext) {
    // Your implementation
  }

  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Update user',
    description: 'Update an existing user with validation',
  })
  @SwaggerRequestBody('User update data', UpdateUserSchema) // Using VineJS schema
  @SwaggerResponse(200, 'User updated successfully', UserSchema)
  async update({ request, response }: HttpContext) {
    // Your implementation
  }
}
```

## Available Decorators

All decorators support TypeBox schemas, Zod schemas, VineJS schemas, and raw JSON Schema objects:

- `@SwaggerInfo(options)` - **Primary decorator combining tags, summary, and description** ⭐
- `@SwaggerParam(options, schema, required?)` - **Enhanced parameter decorator for query/path** ⭐
- `@SwaggerHeader(options, schema, required?)` - **Header parameter decorator** ⭐
- `@SwaggerResponse(status, description, schema?)` - Define response (supports TypeBox/Zod/VineJS/JSON Schema)
- `@SwaggerRequestBody(description, schema, required?)` - Define request body (supports TypeBox/Zod/VineJS/JSON Schema)
- `@SwaggerDeprecated(deprecated?)` - Mark as deprecated
- `@SwaggerSecurity(security)` - Define security requirements
- `@Swagger(options)` - Combined decorator for common options

### Schema Support

You can use any of these schema formats (install the corresponding packages as needed):

```typescript
// TypeBox schema (requires: npm install @sinclair/typebox)
@SwaggerResponse(200, 'Success', Type.Object({
  id: Type.Integer(),
  name: Type.String()
}))

// Zod schema (requires: npm install zod)
@SwaggerRequestBody('User data', z.object({
  name: z.string(),
  email: z.string().email()
}))

// VineJS schema (requires: npm install @vinejs/vine) - Recommended for AdonisJS v6
@SwaggerRequestBody('User data', vine.object({
  name: vine.string().minLength(2),
  email: vine.string().email()
}))

// Raw JSON Schema (no additional dependencies)
@SwaggerResponse(200, 'Success', {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' }
  }
})
```

## CLI Commands

### Generate Documentation

```bash
# Generate JSON and YAML files
node ace swagger:generate

# Generate only JSON
node ace swagger:generate --format=json

# Generate to custom directory
node ace swagger:generate --output=./docs
```

### Validate Specification

```bash
# Validate the generated OpenAPI spec
node ace swagger:validate

# Show detailed validation output
node ace swagger:validate --verbose
```

## Configuration Options

### API Information

```typescript
info: {
  title: 'My API',
  version: '1.0.0',
  description: 'API description',
  contact: {
    name: 'API Support',
    email: 'support@example.com',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
}
```

### Scalar UI Options

```typescript
scalar: {
  theme: 'auto', // 'auto' | 'default' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'deepSpace' | 'laserwave' | 'elysiajs' | 'none'
  layout: 'modern', // 'modern' or 'classic'
  showSidebar: true,
  customCss: `
    /* Your custom styles */
    .scalar-app { font-family: 'Custom Font'; }
  `,
  configuration: {
    // Additional Scalar configuration options
  },
}
```

#### Theme Options

- **`'auto'`** - Automatically detects system preference (light/dark mode)
- **`'default'`** - Scalar's default light theme
- **`'moon'`** - Dark theme with blue accents
- **`'purple'`** - Purple-themed interface
- **`'solarized'`** - Based on the popular Solarized color scheme
- **`'bluePlanet'`** - Blue-themed space design
- **`'saturn'`** - Saturn-inspired theme
- **`'kepler'`** - Space exploration theme
- **`'mars'`** - Mars-inspired red theme
- **`'deepSpace'`** - Dark space theme
- **`'laserwave'`** - Retro synthwave theme
- **`'elysiajs'`** - ElysiaJS-inspired theme
- **`'none'`** - No theme (for custom styling)

### Route Filtering

```typescript
routes: {
  include: ['/api/*', '/v1/*'],
  exclude: ['/docs*', '/health*', '/admin/*'],
}
```

> **Note**: Only routes with explicit decorators will be documented, regardless of include/exclude patterns. The filtering options help optimize which routes are scanned for decorators.

### Custom Specification

```typescript
customSpec: {
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
    },
  },
}
```

## Examples

See the `examples/` directory for complete examples:

- `controller_example.ts` - Controller with TypeBox and Zod decorators
- `config_example.ts` - Advanced configuration

## Troubleshooting

### Edge view engine is required error

If you see this error:

```
Edge view engine is required for Open Swagger documentation. Please ensure Edge is properly configured in your AdonisJS application.
```

**Solution**: Install and configure Edge.js:

```bash
node ace add edge
```

**Why this happens**:

- The **Web starter kit** includes Edge.js by default
- The **API**, **Slim**, and **Inertia** starter kits do not include Edge.js
- Open Swagger uses Edge templates for rendering the documentation UI

### Documentation not showing routes

If your routes don't appear in the documentation:

1. **Check decorators**: Only routes with explicit decorators are documented
2. **Verify route patterns**: Check your `include`/`exclude` patterns in config
3. **Controller resolution**: Ensure controllers can be imported correctly

### Schema conversion issues

If schemas aren't converting properly:

1. **Install schema libraries**: Ensure TypeBox, Zod, or VineJS are installed if you're using them
2. **Check schema format**: Verify your schemas match the expected format
3. **Fallback behavior**: The package will fallback to raw JSON Schema if conversion fails

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

MIT License - see [LICENSE](LICENSE) file for details.
