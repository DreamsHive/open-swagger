/**
 * Supported schema validators
 */
export type SchemaValidator = 'typebox' | 'zod' | 'vinejs'

/**
 * Components configuration for generating OpenAPI component schemas
 */
export interface ComponentsConfig {
  /**
   * Array of directory paths or file paths to include schemas for the components schema
   * Can include multiple files like ["/schemas/index.ts", "/models/*.ts"] or directory patterns
   */
  include: string[]

  /**
   * Exclude patterns for schema files (optional)
   * Array of glob patterns to exclude specific files
   */
  exclude?: string[]
}

/**
 * Configuration options for Open Swagger
 */
export interface OpenSwaggerConfig {
  /**
   * Enable or disable the swagger documentation
   */
  enabled: boolean

  /**
   * Path where the documentation will be served
   */
  path: string

  /**
   * Schema validator to use for schema conversion
   * This eliminates auto-detection issues and improves performance
   */
  validator?: SchemaValidator

  /**
   * Components configuration for generating OpenAPI component schemas
   * This allows openapi-typescript to generate proper TypeScript types
   */
  components?: ComponentsConfig

  /**
   * OpenAPI specification information
   */
  info: {
    title: string
    version: string
    description?: string
    contact?: {
      name?: string
      email?: string
      url?: string
    }
    license?: {
      name: string
      url?: string
    }
  }

  /**
   * Servers configuration
   */
  servers?: Array<{
    url: string
    description?: string
  }>

  /**
   * Security schemes
   */
  securitySchemes?: Record<string, any>

  /**
   * Default security requirements
   */
  security?: Array<Record<string, string[]>>

  /**
   * Scalar UI configuration
   */
  scalar: {
    /**
     * Theme configuration
     * Use 'auto' for automatic light/dark detection, or choose a specific Scalar theme
     */
    theme?:
      | 'auto'
      | 'alternate'
      | 'default'
      | 'moon'
      | 'purple'
      | 'solarized'
      | 'bluePlanet'
      | 'saturn'
      | 'kepler'
      | 'mars'
      | 'deepSpace'
      | 'laserwave'
      | 'elysiajs'
      | 'none'

    /**
     * Custom CSS
     */
    customCss?: string

    /**
     * Layout configuration
     */
    layout?: 'modern' | 'classic'

    /**
     * Show/hide the sidebar
     */
    showSidebar?: boolean

    /**
     * Additional Scalar configuration options
     */
    configuration?: Record<string, any>
  }

  /**
   * Route scanning options
   */
  routes: {
    /**
     * Include routes matching these patterns
     */
    include?: string[]

    /**
     * Exclude routes matching these patterns
     */
    exclude?: string[]

    /**
     * Automatically scan for routes
     */
    autoScan?: boolean
  }

  /**
   * Tags configuration for grouping endpoints
   */
  tags?: Array<{
    name: string
    description?: string
  }>

  /**
   * Custom OpenAPI specification to merge with auto-generated spec
   */
  customSpec?: Record<string, any>
}

/**
 * Route information extracted from AdonisJS
 */
export interface RouteInfo {
  method: string
  pattern: string
  handler: string
  middleware: string[]
  name?: string
  domain?: string
  /**
   * Import function for lazy-loaded controllers (array handler format)
   * Used when route handler is [() => import('#controllers/...'), 'methodName']
   */
  importFunction?: () => Promise<any>
  /**
   * Direct controller class reference (array handler format)
   * Used when route handler is [AuthController, 'methodName']
   */
  controllerClass?: any
  /**
   * Method name for array handler format
   * Used when route handler is [() => import('#controllers/...'), 'methodName']
   * or [AuthController, 'methodName']
   */
  methodName?: string
}

/**
 * OpenAPI operation object
 */
export interface OpenAPIOperation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  parameters?: any[]
  requestBody?: any
  responses: Record<string, any>
  security?: Array<Record<string, string[]>>
  deprecated?: boolean
}

/**
 * OpenAPI specification
 */
export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
    contact?: any
    license?: any
  }
  servers?: any[]
  paths: Record<string, Record<string, OpenAPIOperation>>
  components?: {
    schemas?: Record<string, any>
    securitySchemes?: Record<string, any>
  }
  security?: Array<Record<string, string[]>>
  tags?: Array<{
    name: string
    description?: string
  }>
}

/**
 * Supported schema types for decorators
 */
export type SchemaInput =
  | any // Raw JSON Schema object
  | { _def: any } // Zod schema
  | { [Symbol.toStringTag]: 'TypeBox' } // TypeBox schema
  | { type: string; properties?: any; [key: string]: any } // VineJS schema

/**
 * Decorator metadata for custom documentation
 */
export interface SwaggerMetadata {
  summary?: string
  description?: string
  tags?: string[]
  parameters?: any[]
  requestBody?: any
  responses?: Record<string, any>
  security?: Array<Record<string, string[]>>
  deprecated?: boolean
}
