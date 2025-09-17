import 'reflect-metadata'
import type { SwaggerMetadata, SchemaInput, SchemaValidator } from './types.js'
import {
  convertToJsonSchema,
  createResponseSchema,
  createRequestBodySchema,
} from './schema_utils.js'

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
 */
export function SwaggerResponse(status: number, description: string, schema?: SchemaInput) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    const existing = getSwaggerMetadata(target, propertyKey)
    const responses = existing?.responses || {}

    // Convert schema asynchronously and store the promise
    const responsePromise = (async () => {
      const responseSchema = schema
        ? await createResponseSchema(schema, getGlobalValidator())
        : undefined

      return {
        description,
        ...responseSchema,
      }
    })()

    // Store the promise in responses - we'll resolve this later during spec generation
    responses[status.toString()] = responsePromise

    setSwaggerMetadata(target, propertyKey, { responses })
  }
}

/**
 * Swagger request body decorator
 */
export function SwaggerRequestBody(
  description: string,
  schema: SchemaInput,
  required: boolean = true
) {
  return function (target: any, propertyKey: string, _descriptor: PropertyDescriptor) {
    // Convert schema asynchronously and store the promise
    const requestBodyPromise = (async () => {
      const bodySchema = await createRequestBodySchema(schema, getGlobalValidator())

      return {
        description,
        required,
        ...bodySchema,
      }
    })()

    setSwaggerMetadata(target, propertyKey, { requestBody: requestBodyPromise })
  }
}

/**
 * Enhanced swagger parameter decorator with improved API
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

    // Convert schema asynchronously and store the promise
    const parameterPromise = (async () => {
      const convertedSchema = await convertToJsonSchema(schema, getGlobalValidator())

      return {
        name: options.name,
        in: options.location,
        required,
        schema: convertedSchema,
        description: options.description,
      }
    })()

    parameters.push(parameterPromise)

    setSwaggerMetadata(target, propertyKey, { parameters })
  }
}

/**
 * Swagger header parameter decorator
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

    // Convert schema asynchronously and store the promise
    const parameterPromise = (async () => {
      const convertedSchema = await convertToJsonSchema(schema, getGlobalValidator())

      return {
        name: options.name,
        in: 'header',
        required,
        schema: convertedSchema,
        description: options.description,
      }
    })()

    parameters.push(parameterPromise)

    setSwaggerMetadata(target, propertyKey, { parameters })
  }
}

/**
 * Swagger parameter decorator (legacy - kept for backward compatibility)
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

    // Convert schema asynchronously and store the promise
    const parameterPromise = (async () => {
      const convertedSchema = await convertToJsonSchema(schema, getGlobalValidator())

      return {
        name,
        in: location,
        required,
        schema: convertedSchema,
        description,
      }
    })()

    parameters.push(parameterPromise)

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
