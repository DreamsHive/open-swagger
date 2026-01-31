/**
 * Supported schema validators
 */
export type SchemaValidator = 'typebox' | 'zod' | 'vinejs'

/**
 * Supported content types for request body
 */
export type RequestBodyContentType =
  | 'application/json'
  | 'multipart/form-data'
  | 'application/x-www-form-urlencoded'

/**
 * Options for file schema helpers
 */
export interface FileOptions {
  /**
   * Description of the file field
   */
  description?: string
  /**
   * Whether the field accepts multiple files
   * @default false
   */
  multiple?: boolean
  /**
   * Minimum number of files (only applicable when multiple: true)
   */
  minItems?: number
  /**
   * Maximum number of files (only applicable when multiple: true)
   */
  maxItems?: number
}

/**
 * Options for @SwaggerRequestBody decorator
 */
export interface SwaggerRequestBodyOptions {
  /**
   * Whether the request body is required
   * @default true
   */
  required?: boolean
  /**
   * Content type for the request body
   * @default 'application/json'
   */
  contentType?: RequestBodyContentType
}

/**
 * API Key security scheme (for header, query, or cookie authentication)
 */
export interface ApiKeySecurityScheme {
  type: 'apiKey'
  /**
   * The location of the API key
   * - 'header': API key is sent in a header (e.g., X-API-Key)
   * - 'query': API key is sent as a query parameter
   * - 'cookie': API key is sent in a cookie (e.g., session cookies, Better-Auth)
   */
  in: 'header' | 'query' | 'cookie'
  /**
   * The name of the header, query parameter, or cookie
   */
  name: string
  /**
   * Optional description
   */
  description?: string
}

/**
 * HTTP security scheme (for Bearer token or Basic authentication)
 */
export interface HttpSecurityScheme {
  type: 'http'
  /**
   * The HTTP authentication scheme
   * - 'bearer': Bearer token authentication (JWT)
   * - 'basic': Basic authentication
   */
  scheme: 'bearer' | 'basic'
  /**
   * Bearer token format hint (e.g., 'JWT')
   * Only applicable when scheme is 'bearer'
   */
  bearerFormat?: string
  /**
   * Optional description
   */
  description?: string
}

/**
 * OAuth2 security scheme
 */
export interface OAuth2SecurityScheme {
  type: 'oauth2'
  /**
   * OAuth2 flows configuration
   */
  flows: {
    /**
     * Authorization Code flow
     */
    authorizationCode?: {
      authorizationUrl: string
      tokenUrl: string
      refreshUrl?: string
      scopes: Record<string, string>
    }
    /**
     * Client Credentials flow
     */
    clientCredentials?: {
      tokenUrl: string
      refreshUrl?: string
      scopes: Record<string, string>
    }
    /**
     * Implicit flow (deprecated but still supported)
     */
    implicit?: {
      authorizationUrl: string
      refreshUrl?: string
      scopes: Record<string, string>
    }
    /**
     * Password flow (deprecated but still supported)
     */
    password?: {
      tokenUrl: string
      refreshUrl?: string
      scopes: Record<string, string>
    }
  }
  /**
   * Optional description
   */
  description?: string
}

/**
 * OpenID Connect security scheme
 */
export interface OpenIdConnectSecurityScheme {
  type: 'openIdConnect'
  /**
   * OpenID Connect discovery URL
   */
  openIdConnectUrl: string
  /**
   * Optional description
   */
  description?: string
}

/**
 * Union type for all supported security schemes
 */
export type SecurityScheme =
  | ApiKeySecurityScheme
  | HttpSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme

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
 * Basic authentication configuration for docs endpoints
 * Protects /docs, /docs/json, /docs/yaml from unauthorized access
 */
export interface BasicAuthConfig {
  /**
   * Enable basic authentication for docs endpoints
   * @default false
   */
  enabled: boolean

  /**
   * Username for basic auth
   * Supports env() helper for environment variables
   */
  username: string

  /**
   * Password for basic auth
   * Supports env() helper for environment variables
   */
  password: string

  /**
   * Realm name shown in browser auth dialog
   * @default 'API Documentation'
   */
  realm?: string
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
   * Basic authentication for docs endpoints
   * Protects documentation from unauthorized access in production
   */
  basicAuth?: BasicAuthConfig

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
   * Supports: API Key (header, query, cookie), HTTP (bearer, basic), OAuth2, OpenID Connect
   */
  securitySchemes?: Record<string, SecurityScheme>

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
     * Include credentials (cookies) in API requests
     * Required for cookie-based authentication
     * @default true
     */
    withCredentials?: boolean

    /**
     * Initial dark mode state
     * @default false
     */
    darkMode?: boolean

    /**
     * Hide the dark mode toggle button
     * @default false
     */
    hideDarkModeToggle?: boolean

    /**
     * Hide the "Test Request" button
     * @default false
     */
    hideTestRequestButton?: boolean

    /**
     * Hide the models/schemas section
     * @default false
     */
    hideModels?: boolean

    /**
     * Hide the search bar
     * @default false
     */
    hideSearch?: boolean

    /**
     * Keyboard shortcut for search (used with CMD/CTRL)
     * @default 'k'
     */
    searchHotKey?: string

    /**
     * Proxy URL for API requests (helps with CORS)
     */
    proxyUrl?: string

    /**
     * Persist authentication credentials in localStorage
     * @default false
     */
    persistAuth?: boolean

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
     * HTTP methods to ignore/exclude from documentation.
     * Useful for filtering out auto-generated HEAD endpoints.
     * Method matching is case-insensitive.
     * @example ['HEAD'] - Exclude all HEAD endpoints
     * @example ['HEAD', 'OPTIONS'] - Exclude HEAD and OPTIONS endpoints
     */
    ignoreMethods?: string[]

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

/**
 * Raw response data stored by decorators (before schema conversion)
 * Schema conversion is deferred until spec generation to avoid circular dependencies
 */
export interface RawResponseData {
  [rawMetadataMarker: symbol]: true
  description: string
  schema?: SchemaInput
  contentType?: string
}

/**
 * Raw request body data stored by decorators (before schema conversion)
 * Schema conversion is deferred until spec generation to avoid circular dependencies
 */
export interface RawRequestBodyData {
  [rawMetadataMarker: symbol]: true
  description: string
  schema: SchemaInput
  required: boolean
  contentType: string
}

/**
 * Raw parameter data stored by decorators (before schema conversion)
 * Schema conversion is deferred until spec generation to avoid circular dependencies
 */
export interface RawParameterData {
  [rawMetadataMarker: symbol]: true
  name: string
  in: 'query' | 'path' | 'header'
  required: boolean
  schema: SchemaInput
  description?: string
}
