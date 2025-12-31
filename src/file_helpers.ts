import type { FileOptions } from './types.js'

/**
 * Symbol to mark file schema objects for identification during schema conversion
 */
export const FILE_SCHEMA_SYMBOL = Symbol.for('openswagger:file')

/**
 * Symbol to mark VineJS-compatible file schema objects
 */
export const VINE_FILE_SCHEMA_SYMBOL = Symbol.for('openswagger:vine-file')

/**
 * Symbol to mark Zod-compatible file schema objects
 */
export const ZOD_FILE_SCHEMA_SYMBOL = Symbol.for('openswagger:zod-file')

/**
 * Symbol to mark TypeBox-compatible file schema objects
 */
export const TYPEBOX_FILE_SCHEMA_SYMBOL = Symbol.for('openswagger:typebox-file')

/**
 * Base OpenAPI file schema interface
 */
export interface OpenAPIFileSchema {
  type: 'string' | 'array'
  format?: 'binary'
  items?: { type: 'string'; format: 'binary' }
  description?: string
  minItems?: number
  maxItems?: number
  /**
   * Internal marker to identify file schemas
   */
  [FILE_SCHEMA_SYMBOL]: true
}

/**
 * VineJS-compatible file schema interface
 */
export interface VineFileSchema extends OpenAPIFileSchema {
  clone(): VineFileSchema
  options: { bail: boolean; allowNull: boolean; isOptional: boolean }
  validations: any[]
  [VINE_FILE_SCHEMA_SYMBOL]: true
}

/**
 * Zod-compatible file schema interface
 */
export interface ZodFileSchema extends OpenAPIFileSchema {
  _def: { typeName: string; description?: string }
  _type: string
  parse: (data: unknown) => unknown
  safeParse: (data: unknown) => { success: boolean; data?: unknown; error?: unknown }
  optional: () => ZodFileSchema
  nullable: () => ZodFileSchema
  describe: (description: string) => ZodFileSchema
  [ZOD_FILE_SCHEMA_SYMBOL]: true
}

/**
 * TypeBox-compatible file schema interface
 */
export interface TypeBoxFileSchema extends OpenAPIFileSchema {
  [Kind]: 'String'
  [TYPEBOX_FILE_SCHEMA_SYMBOL]: true
}

// TypeBox uses Symbol.for('TypeBox.Kind')
const Kind = Symbol.for('TypeBox.Kind')

/**
 * Create base file schema data
 */
function createBaseFileSchema(
  options?: FileOptions
): Omit<OpenAPIFileSchema, typeof FILE_SCHEMA_SYMBOL> {
  if (options?.multiple) {
    const schema: any = {
      type: 'array' as const,
      items: { type: 'string' as const, format: 'binary' as const },
    }
    if (options?.description) schema.description = options.description
    if (options?.minItems !== undefined) schema.minItems = options.minItems
    if (options?.maxItems !== undefined) schema.maxItems = options.maxItems
    return schema
  }

  const schema: any = {
    type: 'string' as const,
    format: 'binary' as const,
  }
  if (options?.description) schema.description = options.description
  return schema
}

/**
 * Create an OpenAPI file schema
 * Works with raw JSON Schema - use this for generic/manual schema definitions
 *
 * @example Single file
 * ```typescript
 * openapiFile({ description: "CSV file with customers" })
 * ```
 *
 * @example Multiple files
 * ```typescript
 * openapiFile({ multiple: true, minItems: 1, maxItems: 5 })
 * ```
 */
export function openapiFile(options?: FileOptions): OpenAPIFileSchema {
  return {
    ...createBaseFileSchema(options),
    [FILE_SCHEMA_SYMBOL]: true,
  } as OpenAPIFileSchema
}

/**
 * Create a VineJS-compatible file schema for OpenAPI
 * Use this when your validator is set to 'vinejs'
 *
 * This returns a VineJS-compatible object that can be used inside vine.object()
 * and will be properly converted to OpenAPI file schema during spec generation.
 *
 * @example
 * ```typescript
 * import vine from "@vinejs/vine";
 * import { vineFile } from "adonis-open-swagger";
 *
 * @SwaggerRequestBody(
 *   "Create Campaign with File",
 *   vine.object({
 *     name: vine.string(),
 *     file: vineFile({ description: "CSV file" }),
 *   }),
 *   { contentType: "multipart/form-data" }
 * )
 * ```
 */
export function vineFile(options?: FileOptions): VineFileSchema {
  const baseSchema = createBaseFileSchema(options)

  // Create a VineJS-compatible wrapper that can be used inside vine.object()
  const vineCompatibleSchema: VineFileSchema = {
    ...baseSchema,
    [FILE_SCHEMA_SYMBOL]: true,
    [VINE_FILE_SCHEMA_SYMBOL]: true,
    // VineJS requires these properties
    options: {
      bail: true,
      allowNull: false,
      isOptional: false,
    },
    validations: [],
    // VineJS requires a clone method for getProperties()
    clone() {
      return vineFile(options)
    },
  } as VineFileSchema

  return vineCompatibleSchema
}

/**
 * Create a TypeBox-compatible file schema for OpenAPI
 * Use this when your validator is set to 'typebox'
 *
 * @example
 * ```typescript
 * import { Type } from "@sinclair/typebox";
 * import { typeboxFile } from "adonis-open-swagger";
 *
 * @SwaggerRequestBody(
 *   "Create Campaign with File",
 *   Type.Object({
 *     name: Type.String(),
 *     file: typeboxFile({ description: "CSV file" }),
 *   }),
 *   { contentType: "multipart/form-data" }
 * )
 * ```
 */
export function typeboxFile(options?: FileOptions): TypeBoxFileSchema {
  const baseSchema = createBaseFileSchema(options)

  // Create a TypeBox-compatible wrapper
  const typeboxCompatibleSchema: TypeBoxFileSchema = {
    ...baseSchema,
    [FILE_SCHEMA_SYMBOL]: true,
    [TYPEBOX_FILE_SCHEMA_SYMBOL]: true,
    [Kind]: 'String',
  } as TypeBoxFileSchema

  return typeboxCompatibleSchema
}

/**
 * Create a Zod-compatible file schema for OpenAPI
 * Use this when your validator is set to 'zod'
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { zodFile } from "adonis-open-swagger";
 *
 * @SwaggerRequestBody(
 *   "Create Campaign with File",
 *   z.object({
 *     name: z.string(),
 *     file: zodFile({ description: "CSV file" }),
 *   }),
 *   { contentType: "multipart/form-data" }
 * )
 * ```
 */
export function zodFile(options?: FileOptions): ZodFileSchema {
  const baseSchema = createBaseFileSchema(options)

  // Create a Zod-compatible wrapper
  const zodCompatibleSchema: ZodFileSchema = {
    ...baseSchema,
    [FILE_SCHEMA_SYMBOL]: true,
    [ZOD_FILE_SCHEMA_SYMBOL]: true,
    _def: {
      typeName: 'ZodString',
      description: options?.description,
    },
    _type: 'string',
    // Provide stub methods that Zod expects
    parse: (data: unknown) => data,
    safeParse: (data: unknown) => ({ success: true, data }),
    optional: () => zodFile(options),
    nullable: () => zodFile(options),
    describe: (desc: string) => zodFile({ ...options, description: desc }),
  } as ZodFileSchema

  return zodCompatibleSchema
}

/**
 * Check if a schema object is a file schema created by our helpers
 */
export function isFileSchema(schema: any): schema is OpenAPIFileSchema {
  if (!schema || typeof schema !== 'object') {
    return false
  }
  return schema[FILE_SCHEMA_SYMBOL] === true
}

/**
 * Check if a schema object is a VineJS file schema
 */
export function isVineFileSchema(schema: any): schema is VineFileSchema {
  if (!schema || typeof schema !== 'object') {
    return false
  }
  return schema[VINE_FILE_SCHEMA_SYMBOL] === true
}

/**
 * Properties to exclude when converting to clean OpenAPI format
 * These are internal/validator-specific properties that shouldn't be in the output
 */
const EXCLUDED_PROPERTIES = new Set([
  'clone', // VineJS clone method
  'options', // VineJS options
  'validations', // VineJS validations
  '_def', // Zod definition
  '_type', // Zod type
  'parse', // Zod parse method
  'safeParse', // Zod safeParse method
  'optional', // Zod optional method
  'nullable', // Zod nullable method
  'describe', // Zod describe method
])

/**
 * Convert file schema to clean OpenAPI format (removes internal markers and validator-specific props)
 */
export function toOpenAPIFileSchema(schema: OpenAPIFileSchema): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key of Object.keys(schema)) {
    // Skip excluded properties and methods
    if (EXCLUDED_PROPERTIES.has(key)) continue
    if (typeof (schema as any)[key] === 'function') continue

    result[key] = (schema as any)[key]
  }

  return result
}
