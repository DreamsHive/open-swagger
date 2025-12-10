# Adonis Open Swagger

Modern Swagger/OpenAPI integration for AdonisJS v6 with Scalar UI.

## Features

- 🚀 **Modern UI**: Uses Scalar instead of traditional Swagger UI
- 🎯 **Decorator-driven**: Documentation only generated for routes with explicit decorators
- 🔧 **Schema Support**: Native TypeBox, Zod, and VineJS schema support alongside raw JSON Schema
- 🧩 **Components Feature**: Automatic OpenAPI component schema generation for `openapi-typescript` integration
- 🎨 **Customizable**: Flexible configuration and theming options
- 🛠️ **CLI Integration**: Seamless integration with AdonisJS Ace commands
- 📦 **TypeScript**: Full TypeScript support with proper type definitions
- ⚡ **Dynamic Loading**: Leverages AdonisJS v6's lazy loading for optimal performance
- 🏗️ **Universal Compatibility**: Works with all AdonisJS starter kits (API, Slim, Web, Inertia)
- 🔧 **Zero Dependencies**: No need to install Edge.js separately - included in the package

## Installation

```bash
# Core package (includes everything you need)
node ace add adonis-open-swagger

# Optional: Install schema libraries based on your preference
npm install @sinclair/typebox  # For TypeBox schemas
npm install zod                # For Zod schemas
npm install @vinejs/vine       # For VineJS schemas (recommended for AdonisJS)

# Optional: For TypeScript type generation from OpenAPI components
npm install -D openapi-typescript  # Generates TypeScript types from OpenAPI specs
```

### Requirements

- **No additional dependencies required**: The package includes Edge.js for template rendering
- **Works with all AdonisJS starter kits**: API, Slim, Web, and Inertia
- **Schema libraries**: Optional dependencies based on your validation needs

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
  components: {
    include: ['app/schemas'], // Optional: for openapi-typescript integration
  },
})
```

### Components Feature (NEW) 🎉

The Components feature automatically generates OpenAPI component schemas from your validation schema files, enabling proper TypeScript type generation with `openapi-typescript` instead of `schemas: never`.

#### Configuration

Add a `components` section to your `config/swagger.ts`:

```typescript
export default defineConfig({
  // ... other configuration

  components: {
    /**
     * Array of file paths or directory paths to include schemas
     * Supports multiple files, directories, and patterns
     */
    include: [
      'app/schemas/index.ts', // Single file
      'app/schemas/product.schema.ts', // Another file
      'app/models', // Entire directory (recursive)
      'app/validators/*.ts', // Pattern matching
    ],

    /**
     * Optional: Exclude patterns for schema files
     * Array of glob patterns to exclude specific files
     */
    exclude: ['**/*.test.ts', '**/*.spec.ts'],
  },
})
```

#### Schema File Structure

Create schema files using VineJS, Zod, or TypeBox:

```typescript
// app/schemas/user.schema.ts
import vine from '@vinejs/vine'

export const userSchema = vine.object({
  id: vine.string(),
  name: vine.string(),
  email: vine.string().email(),
  age: vine.number().optional(),
  createdAt: vine.string(),
  updatedAt: vine.string(),
})

export const createUserSchema = vine.object({
  name: vine.string().minLength(2),
  email: vine.string().email(),
  age: vine.number().optional(),
})
```

```typescript
// app/schemas/product.schema.ts
import { z } from 'zod'

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
  inStock: z.boolean(),
  tags: z.array(z.string()),
})
```

```typescript
// app/models/order.schema.ts
import { Type } from '@sinclair/typebox'

export const orderSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  total: Type.Number({ minimum: 0 }),
  status: Type.Union([Type.Literal('pending'), Type.Literal('confirmed'), Type.Literal('shipped')]),
})
```

#### Generated TypeScript Types

After configuring components, generate TypeScript types:

```bash
# Start your AdonisJS server
npm run dev

# Generate TypeScript types from OpenAPI spec
npx openapi-typescript http://localhost:3333/docs/json -o ./types/api-schema.ts
```

Now you can use fully-typed API components in your frontend:

```typescript
// Frontend usage
import { components } from './types/api-schema'

// Extract component types - fully typed!
type User = components['schemas']['userSchema']
type CreateUser = components['schemas']['createUserSchema']
type Product = components['schemas']['productSchema']
type Order = components['schemas']['orderSchema']

// Use in your application with full type safety
export class ApiClient {
  async createUser(data: CreateUser): Promise<User> {
    // TypeScript ensures correct data structure
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  }

  async getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  }

  async createProduct(data: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  }
}
```

#### Benefits

✅ **Type Safety**: Full TypeScript type safety for API components
✅ **IntelliSense**: Complete IDE support with autocomplete
✅ **Consistency**: Ensures frontend and backend stay in sync
✅ **Zero Runtime Cost**: Pure TypeScript types with no runtime overhead
✅ **Multi-Library Support**: Works with VineJS, Zod, and TypeBox
✅ **Flexible Organization**: Support for multiple files and directories

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

### Route Handler Formats

Open Swagger supports both traditional string-based route handlers and the modern array-based import format recommended in AdonisJS v6:

#### Array Handler Format (Recommended)

```typescript
// start/routes.ts
import router from '@adonisjs/core/services/router'

// Define import functions
const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')

// Use array format: [ImportFunction, 'methodName']
router
  .group(() => {
    router.post('login', [AuthController, 'login']).as('login')
    router.post('logout', [AuthController, 'logout']).as('logout')
    router.post('register', [AuthController, 'register']).as('register')
  })
  .as('auth')
  .prefix('api/auth')

router
  .group(() => {
    router.get('users', [UsersController, 'index'])
    router.get('users/:id', [UsersController, 'show'])
    router.post('users', [UsersController, 'store'])
    router.put('users/:id', [UsersController, 'update'])
    router.delete('users/:id', [UsersController, 'destroy'])
  })
  .prefix('api/v1')
```

#### String Handler Format

```typescript
// start/routes.ts
import router from '@adonisjs/core/services/router'

// Use string format: '#controllers/controller_name.methodName'
router
  .group(() => {
    router.post('login', '#controllers/auth_controller.login')
    router.post('logout', '#controllers/auth_controller.logout')
    router.post('register', '#controllers/auth_controller.register')
  })
  .prefix('api/auth')
```

#### Mixed Usage

You can use both formats in the same application:

```typescript
// start/routes.ts
import router from '@adonisjs/core/services/router'

const UsersController = () => import('#controllers/users_controller')

router
  .group(() => {
    // Array handler (recommended)
    router.get('profile', [UsersController, 'profile'])

    // String handler (alternative format)
    router.get('settings', '#controllers/users_controller.settings')
  })
  .prefix('api/user')
```

**Benefits of Array Handler Format:**

- ✅ Better TypeScript support and IntelliSense
- ✅ Lazy loading of controllers (better performance)
- ✅ Explicit import dependencies
- ✅ Recommended by AdonisJS v6 documentation

### Route Filtering

```typescript
routes: {
  include: ['/api/*', '/v1/*'],
  exclude: ['/docs*', '/health*', '/admin/*'],
}
```

> **Note**: Only routes with explicit decorators will be documented, regardless of include/exclude patterns. The filtering options help optimize which routes are scanned for decorators.

### Security Schemes

Open Swagger supports all OpenAPI 3.0 security schemes including Cookie Authentication (useful for session-based auth like [Better-Auth](https://www.better-auth.com/)):

```typescript
// config/swagger.ts
export default defineConfig({
  // ... other config

  securitySchemes: {
    // Cookie Authentication (for session-based auth)
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'session', // or 'JSESSIONID', 'auth_token', etc.
      description: 'Session cookie for authentication',
    },

    // Bearer Token (JWT) Authentication
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your JWT token',
    },

    // API Key in Header
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      description: 'API key passed in header',
    },

    // Basic Authentication
    basicAuth: {
      type: 'http',
      scheme: 'basic',
      description: 'Basic HTTP authentication',
    },

    // OAuth2 Authentication
    oauth2Auth: {
      type: 'oauth2',
      description: 'OAuth2 authentication',
      flows: {
        authorizationCode: {
          authorizationUrl: 'https://example.com/oauth/authorize',
          tokenUrl: 'https://example.com/oauth/token',
          scopes: {
            'read:users': 'Read user information',
            'write:users': 'Modify user information',
          },
        },
      },
    },
  },

  // Global security (applied to all endpoints)
  security: [
    { cookieAuth: [] },
    // { bearerAuth: [] },
  ],
})
```

#### Using `@SwaggerSecurity` Decorator

Apply security requirements to specific endpoints:

```typescript
import { SwaggerInfo, SwaggerSecurity, SwaggerResponse } from 'adonis-open-swagger'

export default class UsersController {
  // Use cookie authentication for this endpoint
  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Get current user profile',
  })
  @SwaggerSecurity([{ cookieAuth: [] }])
  @SwaggerResponse(200, 'User profile retrieved')
  async profile({ auth, response }: HttpContext) {
    return response.ok(auth.user)
  }

  // Public endpoint (no authentication required)
  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Get public user info',
  })
  @SwaggerSecurity([]) // Empty array = no security required
  @SwaggerResponse(200, 'Public user info')
  async publicInfo({ response }: HttpContext) {
    return response.ok({ message: 'Public info' })
  }

  // OAuth2 with specific scopes
  @SwaggerInfo({
    tags: ['Admin'],
    summary: 'Delete user',
  })
  @SwaggerSecurity([{ oauth2Auth: ['write:users'] }])
  @SwaggerResponse(204, 'User deleted')
  async destroy({ params, response }: HttpContext) {
    // Delete user logic
    return response.noContent()
  }
}
```

#### Supported Security Schemes

| Type              | Description                          | Example Use Case                |
| ----------------- | ------------------------------------ | ------------------------------- |
| `apiKey` (cookie) | API key sent in a cookie             | Session-based auth, Better-Auth |
| `apiKey` (header) | API key sent in a header             | API key authentication          |
| `apiKey` (query)  | API key sent as query param          | Legacy API authentication       |
| `http` (bearer)   | Bearer token in Authorization header | JWT authentication              |
| `http` (basic)    | Basic HTTP authentication            | Simple username/password        |
| `oauth2`          | OAuth 2.0 flows                      | Third-party integrations        |
| `openIdConnect`   | OpenID Connect Discovery             | SSO integrations                |

### Components Configuration

The components configuration supports **AdonisJS import aliases** defined in your `package.json` imports field:

```typescript
components: {
  /**
   * Array of file paths or directory paths to include schemas
   * Supports import aliases, patterns, files, and directories
   */
  include: [
    '#schemas/*',                  // Import alias wildcard - expands to all files in app/schemas/
    '#models/*',                   // Import alias wildcard - expands to all files in app/models/
    '#schemas/index',              // Specific import alias
    'app/schemas/index.ts',        // Single file (regular path)
    'app/schemas/*.ts',            // Pattern matching (regular path)
    'app/models',                  // Directory (recursive)
    'app/validators/schemas.ts',   // Specific file
  ],

  /**
   * Optional: Exclude patterns for schema files
   * Array of glob patterns to exclude specific files
   */
  exclude: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/internal/*.ts',
  ],
}
```

#### Import Alias Support

If your `package.json` contains import aliases:

```json
{
  "imports": {
    "#schemas/*": "./app/schemas/*.js",
    "#models/*": "./app/models/*.js",
    "#schemas/index": "./app/schemas/index.js"
  }
}
```

You can use them directly in your components configuration:

- **`#schemas/*`** - Automatically expands to all `.ts` and `.js` files in `app/schemas/`
- **`#schemas/index`** - Resolves to the specific `app/schemas/index.ts` file
- **Regular paths** - Still supported alongside import aliases

The components feature automatically:

- Resolves AdonisJS import aliases from `package.json` imports field
- Expands wildcard patterns to find all matching files
- Scans specified files and directories for schema exports
- Detects VineJS, Zod, and TypeBox schemas by naming conventions and structure
- Converts schemas to OpenAPI component schemas
- Enables proper TypeScript type generation with `openapi-typescript`

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

### Template rendering issues

The package uses Edge.js internally for template rendering. If you encounter any template-related issues:

1. **No action required**: Edge.js is included as a dependency
2. **Works everywhere**: Compatible with all AdonisJS starter kits
3. **Self-contained**: No additional Edge installation needed

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

### Components feature issues

If the components feature isn't working as expected:

1. **Check file paths**: Ensure the `include` paths in your components configuration point to existing files/directories
2. **Verify exports**: Make sure your schema files export schemas with names ending in "Schema" (e.g., `userSchema`, `productSchema`)
3. **Schema detection**: The feature automatically detects VineJS, Zod, and TypeBox schemas - ensure you're using supported patterns
4. **Check console warnings**: Look for warning messages about missing files or conversion errors
5. **Validate generated spec**: Use `node ace swagger:validate` to check if component schemas are properly included
6. **Test with openapi-typescript**: Run `npx openapi-typescript http://localhost:3333/docs/json -o ./types/api-schema.ts` to verify TypeScript generation

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## License

MIT License - see [LICENSE](LICENSE) file for details.
