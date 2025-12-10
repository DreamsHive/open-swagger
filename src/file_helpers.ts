import type { FileOptions } from './types.js'

/**
 * Symbol to mark file schema objects for identification during schema conversion
 */
export const FILE_SCHEMA_SYMBOL = Symbol.for('openswagger:file')

/**
 * OpenAPI file schema interface
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
 * Create a single file schema for OpenAPI
 */
function createSingleFileSchema(options?: FileOptions): OpenAPIFileSchema {
  const schema: OpenAPIFileSchema = {
    type: 'string',
    format: 'binary',
    [FILE_SCHEMA_SYMBOL]: true,
  }

  if (options?.description) {
    schema.description = options.description
  }

  return schema
}

/**
 * Create a multiple files schema for OpenAPI
 */
function createMultipleFilesSchema(options?: FileOptions): OpenAPIFileSchema {
  const schema: OpenAPIFileSchema = {
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    [FILE_SCHEMA_SYMBOL]: true,
  }

  if (options?.description) {
    schema.description = options.description
  }

  if (options?.minItems !== undefined) {
    schema.minItems = options.minItems
  }

  if (options?.maxItems !== undefined) {
    schema.maxItems = options.maxItems
  }

  return schema
}

/**
 * Create an OpenAPI file schema
 * Works with any schema library or raw JSON Schema
 *
 * @example Single file
 * ```typescript
 * openapiFile({ description: "CSV file with customers" })
 * // Generates: { type: "string", format: "binary", description: "CSV file with customers" }
 * ```
 *
 * @example Multiple files
 * ```typescript
 * openapiFile({ description: "Attachment files", multiple: true })
 * // Generates: { type: "array", items: { type: "string", format: "binary" }, description: "Attachment files" }
 * ```
 *
 * @example Multiple files with constraints
 * ```typescript
 * openapiFile({ description: "Gallery images", multiple: true, minItems: 2, maxItems: 10 })
 * ```
 */
export function openapiFile(options?: FileOptions): OpenAPIFileSchema {
  if (options?.multiple) {
    return createMultipleFilesSchema(options)
  }
  return createSingleFileSchema(options)
}

/**
 * Create a VineJS-compatible file schema for OpenAPI
 * Use this when your validator is set to 'vinejs'
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
export function vineFile(options?: FileOptions): OpenAPIFileSchema {
  return openapiFile(options)
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
export function typeboxFile(options?: FileOptions): OpenAPIFileSchema {
  return openapiFile(options)
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
export function zodFile(options?: FileOptions): OpenAPIFileSchema {
  return openapiFile(options)
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
 * Convert file schema to clean OpenAPI format (removes internal marker)
 */
export function toOpenAPIFileSchema(schema: OpenAPIFileSchema): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [FILE_SCHEMA_SYMBOL]: _, ...cleanSchema } = schema
  return cleanSchema
}
