import type { SchemaInput, SchemaValidator, RequestBodyContentType } from './types.js'
import { isFileSchema, toOpenAPIFileSchema, FILE_SCHEMA_SYMBOL } from './file_helpers.js'

/**
 * Clean up Zod-generated JSON Schema by removing complex regex patterns
 * while keeping useful format information
 */
function cleanZodJsonSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  // Create a copy to avoid mutating the original
  const cleaned = { ...schema }

  // Remove complex datetime regex patterns but keep format
  if (cleaned.format === 'date-time' && cleaned.pattern) {
    delete cleaned.pattern
  }

  // Recursively clean nested objects
  if (cleaned.properties) {
    cleaned.properties = Object.fromEntries(
      Object.entries(cleaned.properties).map(([key, value]) => [key, cleanZodJsonSchema(value)])
    )
  }

  // Clean array items
  if (cleaned.items) {
    cleaned.items = cleanZodJsonSchema(cleaned.items)
  }

  // Clean anyOf/oneOf/allOf arrays
  for (const key of ['anyOf', 'oneOf', 'allOf']) {
    if (Array.isArray(cleaned[key])) {
      cleaned[key] = cleaned[key].map(cleanZodJsonSchema)
    }
  }

  return cleaned
}

/**
 * Fix nullable fields in JSON Schema by removing them from required arrays
 */
function fixNullableFieldsInSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  // Create a copy to avoid mutating the original
  const fixed = { ...schema }

  // Fix nullable fields in required array for object schemas
  if (fixed.type === 'object' && fixed.properties && Array.isArray(fixed.required)) {
    fixed.required = fixed.required.filter((fieldName: string) => {
      const property = fixed.properties[fieldName]
      if (!property) return true

      // Check if field is nullable
      if (property.nullable === true) {
        return false // Remove from required if nullable
      }

      return true
    })

    // Remove required array if empty
    if (fixed.required.length === 0) {
      delete fixed.required
    }
  }

  // Recursively fix nested objects
  if (fixed.properties) {
    fixed.properties = Object.fromEntries(
      Object.entries(fixed.properties).map(([key, value]) => [
        key,
        fixNullableFieldsInSchema(value),
      ])
    )
  }

  // Fix array items
  if (fixed.items) {
    fixed.items = fixNullableFieldsInSchema(fixed.items)
  }

  // Fix anyOf/oneOf/allOf arrays
  for (const key of ['anyOf', 'oneOf', 'allOf']) {
    if (Array.isArray(fixed[key])) {
      fixed[key] = fixed[key].map(fixNullableFieldsInSchema)
    }
  }

  return fixed
}

/**
 * Convert Zod schema to JSON Schema using Zod v4's built-in conversion
 */
async function zodToJsonSchema(zodSchema: any): Promise<any> {
  try {
    // Use Zod v4's built-in z.toJSONSchema function with OpenAPI target
    const { z } = await import('zod')
    if (typeof z.toJSONSchema === 'function') {
      const rawSchema = z.toJSONSchema(zodSchema, {
        target: 'openapi-3.0', // Use OpenAPI format for cleaner schemas
      })

      // Clean up the schema to remove complex regex patterns and fix nullable handling
      const cleanedSchema = cleanZodJsonSchema(rawSchema)

      // Fix nullable fields in required array
      return fixNullableFieldsInSchema(cleanedSchema)
    }

    // Fallback if toJSONSchema is not available (older Zod version)
    return {
      type: 'object',
      description: 'Zod schema (requires Zod v4+ for automatic conversion)',
    }
  } catch {
    return {
      type: 'object',
      description: 'Zod schema (Zod v4+ required for conversion)',
    }
  }
}

/**
 * Convert TypeBox schema to JSON Schema
 */
function typeBoxToJsonSchema(typeBoxSchema: any): any {
  try {
    // TypeBox schemas are already JSON Schema compatible
    // But we need to fix nullable field handling in required arrays
    return fixTypeBoxNullableFields(typeBoxSchema)
  } catch {
    return { type: 'object', description: 'TypeBox schema (conversion failed)' }
  }
}

/**
 * Fix TypeBox nullable fields by removing them from required arrays
 */
function fixTypeBoxNullableFields(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  // Create a copy to avoid mutating the original
  const fixed = { ...schema }

  // Fix nullable fields in required array for object schemas
  if (fixed.type === 'object' && fixed.properties && Array.isArray(fixed.required)) {
    fixed.required = fixed.required.filter((fieldName: string) => {
      const property = fixed.properties[fieldName]
      if (!property) return true

      // Check if field is nullable using anyOf pattern with null type
      if (property.anyOf && Array.isArray(property.anyOf)) {
        const hasNullType = property.anyOf.some((item: any) => item.type === 'null')
        if (hasNullType) {
          return false // Remove from required if nullable
        }
      }

      return true
    })

    // Remove required array if empty
    if (fixed.required.length === 0) {
      delete fixed.required
    }
  }

  // Recursively fix nested objects
  if (fixed.properties) {
    fixed.properties = Object.fromEntries(
      Object.entries(fixed.properties).map(([key, value]) => [key, fixTypeBoxNullableFields(value)])
    )
  }

  // Fix array items
  if (fixed.items) {
    fixed.items = fixTypeBoxNullableFields(fixed.items)
  }

  // Fix anyOf/oneOf/allOf arrays
  for (const key of ['anyOf', 'oneOf', 'allOf']) {
    if (Array.isArray(fixed[key])) {
      fixed[key] = fixed[key].map(fixTypeBoxNullableFields)
    }
  }

  return fixed
}

/**
 * Convert VineJS schema to JSON Schema
 */
async function vineToJsonSchema(vineSchema: any): Promise<any> {
  try {
    // Import VineJS dynamically (optional dependency)
    const vine = await import('@vinejs/vine')

    // Step 1: Compile the VineJS schema
    const compiledValidator = vine.default.compile(vineSchema)

    // Step 2: Extract schema and refs using toJSON()
    const vineJsonOutput = compiledValidator.toJSON()

    // Step 3: Convert VineJS format to JSON Schema format
    return convertVineJSToJsonSchema(vineJsonOutput)
  } catch {
    // Silent error handling for now
    return { type: 'object', description: 'VineJS schema (conversion failed)' }
  }
}

/**
 * Convert VineJS toJSON output to JSON Schema format
 */
function convertVineJSToJsonSchema(vineOutput: any): any {
  if (!vineOutput || typeof vineOutput !== 'object') {
    return { type: 'object', description: 'Invalid VineJS output' }
  }

  // Extract schema and refs from VineJS toJSON output
  const { schema, refs } = vineOutput

  if (!schema || !schema.schema) {
    return { type: 'object', description: 'No schema found in VineJS output' }
  }

  const vineSchema = schema.schema

  // Handle single field schema (literal type)
  if (vineSchema.type === 'literal') {
    return convertVineJSProperty(vineSchema, refs)
  }

  // Handle object schema
  if (vineSchema.type === 'object' && Array.isArray(vineSchema.properties)) {
    const jsonSchema: any = {
      type: 'object',
      properties: {},
      additionalProperties: false, // Prevent Scalar UI from generating extra properties
    }

    const required: string[] = []

    // Convert each property
    for (const prop of vineSchema.properties) {
      const fieldName = prop.fieldName

      // Skip properties with empty fieldName (these are internal VineJS properties)
      if (!fieldName || fieldName.trim() === '') {
        continue
      }

      // Skip if fieldName is 'propertyName' (VineJS internal field)
      if (fieldName === 'propertyName') {
        continue
      }

      const propertySchema = convertVineJSProperty(prop, refs)
      jsonSchema.properties[fieldName] = propertySchema

      // Add to required if not optional AND not nullable
      // In VineJS, nullable fields should not be required even if isOptional is false
      if (!prop.isOptional && !prop.allowNull) {
        required.push(fieldName)
      }
    }

    // Add required array if there are required fields
    if (required.length > 0) {
      jsonSchema.required = required
    }

    return jsonSchema
  }

  // Fallback for non-object schemas
  return { type: 'object', description: 'Unsupported VineJS schema type' }
}

/**
 * Convert a single VineJS property to JSON Schema property
 */
function convertVineJSProperty(prop: any, refs: any): any {
  const jsonProperty: any = {}

  // Handle array type
  if (prop.type === 'array' && prop.each) {
    jsonProperty.type = 'array'
    jsonProperty.items = convertVineJSProperty(prop.each, refs)

    // Handle nullable arrays
    if (prop.allowNull) {
      jsonProperty.nullable = true
    }

    return jsonProperty
  }

  // Handle object type
  if (prop.type === 'object' && Array.isArray(prop.properties)) {
    jsonProperty.type = 'object'
    jsonProperty.properties = {}
    const required: string[] = []

    for (const nestedProp of prop.properties) {
      const fieldName = nestedProp.fieldName

      // Skip properties with empty fieldName
      if (!fieldName || fieldName.trim() === '') {
        continue
      }

      // CRITICAL FIX: Skip if fieldName is 'propertyName' (VineJS internal field)
      if (fieldName === 'propertyName') {
        continue
      }

      jsonProperty.properties[fieldName] = convertVineJSProperty(nestedProp, refs)

      // Add to required if not optional AND not nullable
      // In VineJS, nullable fields should not be required even if isOptional is false
      if (!nestedProp.isOptional && !nestedProp.allowNull) {
        required.push(fieldName)
      }
    }

    if (required.length > 0) {
      jsonProperty.required = required
    }

    jsonProperty.additionalProperties = false // FORCE to false to prevent Scalar from generating extra properties

    // Handle nullable object types
    if (prop.allowNull) {
      jsonProperty.nullable = true
    }

    return jsonProperty
  }

  // Map VineJS subtypes to JSON Schema types for literal types
  switch (prop.subtype) {
    case 'string':
      jsonProperty.type = 'string'
      break
    case 'number':
      jsonProperty.type = 'number'
      break
    case 'date':
      jsonProperty.type = 'string'
      jsonProperty.format = 'date-time'
      break
    case 'boolean':
      jsonProperty.type = 'boolean'
      break
    default:
      jsonProperty.type = 'string' // fallback
  }

  // Handle nullable fields by adding nullable: true for OpenAPI 3.0 compatibility
  if (prop.allowNull) {
    jsonProperty.nullable = true
  }

  // Process validations to extract constraints
  if (Array.isArray(prop.validations)) {
    for (const validation of prop.validations) {
      const refId = validation.ruleFnId
      const refData = refs[refId]

      if (refData && refData.options) {
        const options = refData.options

        // Map common validation options
        if (options.min !== undefined) {
          if (prop.subtype === 'string') {
            jsonProperty.minLength = options.min
          } else if (prop.subtype === 'number') {
            jsonProperty.minimum = options.min
          }
        }

        if (options.max !== undefined) {
          if (prop.subtype === 'string') {
            jsonProperty.maxLength = options.max
          } else if (prop.subtype === 'number') {
            jsonProperty.maximum = options.max
          }
        }
      }
    }
  }

  return jsonProperty
}

/**
 * Convert various schema formats to JSON Schema
 */
export async function convertToJsonSchema(
  schema: SchemaInput,
  validator?: SchemaValidator
): Promise<any> {
  if (!schema) {
    return undefined
  }

  // If validator is specified, use it directly without auto-detection
  if (validator) {
    switch (validator) {
      case 'zod':
        return await zodToJsonSchema(schema)
      case 'typebox':
        return typeBoxToJsonSchema(schema)
      case 'vinejs':
        return await vineToJsonSchema(schema)
      default:
        // Fallback to auto-detection if unknown validator
        break
    }

    // If we have a validator but it didn't match, return the schema as-is
    if (typeof schema === 'object') {
      return schema
    }
    return schema
  }

  // Auto-detection is disabled - users should specify validator explicitly
  // This ensures better performance and reliability

  // Return schema as-is if no validator specified
  if (typeof schema === 'object') {
    return schema
  }

  // Fallback: return as-is
  return schema
}

/**
 * Utility to create a response schema with proper content type wrapper
 */
export async function createResponseSchema(
  schema: SchemaInput,
  validator?: SchemaValidator
): Promise<any> {
  if (!schema) {
    return undefined
  }

  const jsonSchema = await convertToJsonSchema(schema, validator)

  return {
    content: {
      'application/json': {
        schema: jsonSchema,
      },
    },
  }
}

/**
 * Process schema to convert file helper schemas to proper OpenAPI format
 */
function processSchemaForFiles(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  // Check if this is a file schema
  if (isFileSchema(schema)) {
    return toOpenAPIFileSchema(schema)
  }

  // Process object properties
  if (schema.properties && typeof schema.properties === 'object') {
    const processedProperties: Record<string, any> = {}

    for (const [key, value] of Object.entries(schema.properties)) {
      processedProperties[key] = processSchemaForFiles(value)
    }

    return {
      ...schema,
      properties: processedProperties,
    }
  }

  // Process array items
  if (schema.items) {
    return {
      ...schema,
      items: processSchemaForFiles(schema.items),
    }
  }

  return schema
}

/**
 * Check if a schema contains file fields (recursively)
 */
function schemaContainsFiles(schema: any): boolean {
  if (!schema || typeof schema !== 'object') {
    return false
  }

  // Check if this is a file schema
  if (schema[FILE_SCHEMA_SYMBOL] === true) {
    return true
  }

  // Check format: binary
  if (schema.type === 'string' && schema.format === 'binary') {
    return true
  }

  // Check array of binary strings
  if (
    schema.type === 'array' &&
    schema.items?.type === 'string' &&
    schema.items?.format === 'binary'
  ) {
    return true
  }

  // Check object properties recursively
  if (schema.properties && typeof schema.properties === 'object') {
    for (const value of Object.values(schema.properties)) {
      if (schemaContainsFiles(value)) {
        return true
      }
    }
  }

  return false
}

/**
 * Utility to create a request body schema with proper content type wrapper
 */
export async function createRequestBodySchema(
  schema: SchemaInput,
  validator?: SchemaValidator,
  contentType: RequestBodyContentType = 'application/json'
): Promise<any> {
  if (!schema) {
    return undefined
  }

  const jsonSchema = await convertToJsonSchema(schema, validator)

  // Process the schema to convert file helpers to proper OpenAPI format
  const processedSchema = processSchemaForFiles(jsonSchema)

  // If contentType is multipart/form-data, only use that content type
  if (contentType === 'multipart/form-data') {
    return {
      content: {
        'multipart/form-data': {
          schema: processedSchema,
        },
      },
    }
  }

  // If contentType is application/x-www-form-urlencoded, only use that content type
  if (contentType === 'application/x-www-form-urlencoded') {
    return {
      content: {
        'application/x-www-form-urlencoded': {
          schema: processedSchema,
        },
      },
    }
  }

  // Default: application/json with form-urlencoded fallback (legacy behavior)
  // But if schema contains files, suggest using multipart/form-data
  if (schemaContainsFiles(processedSchema)) {
    // If files are detected but contentType is still application/json,
    // automatically switch to multipart/form-data for better DX
    return {
      content: {
        'multipart/form-data': {
          schema: processedSchema,
        },
      },
    }
  }

  return {
    content: {
      'application/json': {
        schema: processedSchema,
      },
      'application/x-www-form-urlencoded': {
        schema: processedSchema,
      },
    },
  }
}
