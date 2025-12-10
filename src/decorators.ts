import 'reflect-metadata'
import type {
  SwaggerMetadata,
  SchemaInput,
  SchemaValidator,
  SwaggerRequestBodyOptions,
  RequestBodyContentType,
} from './types.js'

// Symbol to mark raw (unconverted) metadata - prevents circular dependency
// by deferring schema conversion until spec generation time
export const RAW_METADATA_MARKER = Symbol.for('open-swagger:raw-metadata')

/**
 * Global configuration for schema validation
 */
let globalValidator: SchemaValidator | undefined

/**
 * Set the global validator configuration
 */
export function setGlobalValidator(validator: SchemaValidator | undefined): void {
  globalValidator = validator
}

/**
 * Get the global validator configuration
 */
export function getGlobalValidator(): SchemaValidator | undefined {
  return globalValidator
}

/**
 * Metadata storage for swagger decorators
 */
const SWAGGER_METADATA = new Map<string, SwaggerMetadata>()

/**
 * Get metadata key for a method
 */
function getMetadataKey(target: any, propertyKey: string): string {
  return `${target.constructor.name}.${propertyKey}`
}

/**
 * Get swagger metadata for a method
 */
export function getSwaggerMetadata(target: any, propertyKey: string): SwaggerMetadata | undefined {
  const key = getMetadataKey(target, propertyKey)
  return SWAGGER_METADATA.get(key)
}

/**
 * Set swagger metadata for a method
 */
export function setSwaggerMetadata(
  target: any,
  propertyKey: string,
  metadata: SwaggerMetadata
): void {
  const key = getMetadataKey(target, propertyKey)
  const existing = SWAGGER_METADATA.get(key) || {}
  SWAGGER_METADATA.set(key, { ...existing, ...metadata })
}

/**
 * Swagger response decorator
 * Stores raw schema data to avoid circular dependencies during module initialization.
 * Schema conversion is deferred until spec generation time.
 */
export function SwaggerResponse(status: number, description: string, schema?: SchemaInput) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    const existing = getSwaggerMetadata(target, propertyKey)
    const responses = existing?.responses || {}

    // Store raw schema data with marker - conversion happens at spec generation time
    // This prevents circular dependency errors from dynamic imports during class decoration
    responses[status.toString()] = {
      [RAW_METADATA_MARKER]: true,
      description,
      schema,
    }

    setSwaggerMetadata(target, propertyKey, { responses })
  }
}

/**
 * Swagger request body decorator
 * Stores raw schema data to avoid circular dependencies during module initialization.
 * Schema conversion is deferred until spec generation time.
 *
 * @example Basic usage (backward compatible)
 * ```typescript
 * @SwaggerRequestBody("User data", userSchema)
 * @SwaggerRequestBody("User data", userSchema, true)
 * ```
 *
 * @example With options object (new API)
 * ```typescript
 * @SwaggerRequestBody("User data", userSchema, { required: true })
 * @SwaggerRequestBody("File upload", fileSchema, { contentType: "multipart/form-data" })
 * ```
 */
export function SwaggerRequestBody(
  description: string,
  schema: SchemaInput,
  options?: boolean | SwaggerRequestBodyOptions
) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    // Handle backward compatibility: options can be boolean (legacy) or object (new)
    let required = true
    let contentType: RequestBodyContentType = 'application/json'

    if (typeof options === 'boolean') {
      // Legacy API: third parameter is required boolean
      required = options
    } else if (options && typeof options === 'object') {
      // New API: third parameter is options object
      required = options.required !== false // Default to true
      contentType = options.contentType || 'application/json'
    }

    // Store raw schema data with marker - conversion happens at spec generation time
    // This prevents circular dependency errors from dynamic imports during class decoration
    setSwaggerMetadata(target, propertyKey, {
      requestBody: {
        [RAW_METADATA_MARKER]: true,
        description,
        schema,
        required,
        contentType,
      },
    })
  }
}

/**
 * Enhanced swagger parameter decorator with improved API
 * Stores raw schema data to avoid circular dependencies during module initialization.
 * Schema conversion is deferred until spec generation time.
 */
export function SwaggerParam(
  options: {
    name: string
    location: 'query' | 'path'
    description?: string
  },
  schema: SchemaInput,
  required: boolean = false
) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    const existing = getSwaggerMetadata(target, propertyKey)
    const parameters = existing?.parameters || []

    // Store raw schema data with marker - conversion happens at spec generation time
    // This prevents circular dependency errors from dynamic imports during class decoration
    parameters.push({
      [RAW_METADATA_MARKER]: true,
      name: options.name,
      in: options.location,
      required,
      schema,
      description: options.description,
    })

    setSwaggerMetadata(target, propertyKey, { parameters })
  }
}

/**
 * Swagger header parameter decorator
 * Stores raw schema data to avoid circular dependencies during module initialization.
 * Schema conversion is deferred until spec generation time.
 */
export function SwaggerHeader(
  options: {
    name: string
    description?: string
  },
  schema: SchemaInput,
  required: boolean = false
) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    const existing = getSwaggerMetadata(target, propertyKey)
    const parameters = existing?.parameters || []

    // Store raw schema data with marker - conversion happens at spec generation time
    // This prevents circular dependency errors from dynamic imports during class decoration
    parameters.push({
      [RAW_METADATA_MARKER]: true,
      name: options.name,
      in: 'header' as const,
      required,
      schema,
      description: options.description,
    })

    setSwaggerMetadata(target, propertyKey, { parameters })
  }
}

/**
 * Swagger parameter decorator (legacy - kept for backward compatibility)
 * Stores raw schema data to avoid circular dependencies during module initialization.
 * Schema conversion is deferred until spec generation time.
 */
export function SwaggerParameter(
  name: string,
  location: 'query' | 'path' | 'header',
  schema: SchemaInput,
  required: boolean = false,
  description?: string
) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    const existing = getSwaggerMetadata(target, propertyKey)
    const parameters = existing?.parameters || []

    // Store raw schema data with marker - conversion happens at spec generation time
    // This prevents circular dependency errors from dynamic imports during class decoration
    parameters.push({
      [RAW_METADATA_MARKER]: true,
      name,
      in: location,
      required,
      schema,
      description,
    })

    setSwaggerMetadata(target, propertyKey, { parameters })
  }
}

/**
 * Swagger deprecated decorator
 */
export function SwaggerDeprecated(deprecated: boolean = true) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    setSwaggerMetadata(target, propertyKey, { deprecated })
  }
}

/**
 * Swagger security decorator
 */
export function SwaggerSecurity(security: Array<Record<string, string[]>>) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    setSwaggerMetadata(target, propertyKey, { security })
  }
}

/**
 * Combined swagger decorator for common use cases
 */
export function Swagger(options: {
  summary?: string
  description?: string
  tags?: string[]
  deprecated?: boolean
}) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    setSwaggerMetadata(target, propertyKey, options)
  }
}

/**
 * Enhanced swagger info decorator that combines tags, summary, and description
 */
export function SwaggerInfo(options: { tags?: string[]; summary?: string; description?: string }) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    setSwaggerMetadata(target, propertyKey, options)
  }
}

// Export all decorators
export {
  SwaggerResponse as Response,
  SwaggerRequestBody as RequestBody,
  SwaggerParameter as Parameter,
  SwaggerParam as Param,
  SwaggerHeader as Header,
  SwaggerDeprecated as Deprecated,
  SwaggerSecurity as Security,
  SwaggerInfo as Info,
}
