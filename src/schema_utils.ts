import type { SchemaInput, SchemaValidator } from './types.js'

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

      // Clean up the schema to remove complex regex patterns
      return cleanZodJsonSchema(rawSchema)
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
    // Just return the schema object directly
    return typeBoxSchema
  } catch {
    return { type: 'object', description: 'TypeBox schema (conversion failed)' }
  }
}

/**
 * Convert VineJS schema to JSON Schema
 */
async function vineToJsonSchema(vineSchema: any): Promise<any> {
  try {
    // Import VineJS dynamically
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

      // Add to required if not optional
      if (!prop.isOptional) {
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

      if (!nestedProp.isOptional) {
        required.push(fieldName)
      }
    }

    if (required.length > 0) {
      jsonProperty.required = required
    }

    jsonProperty.additionalProperties = false // FORCE to false to prevent Scalar from generating extra properties
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
 * Utility to create a request body schema with proper content type wrapper
 */
export async function createRequestBodySchema(
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
      'application/x-www-form-urlencoded': {
        schema: jsonSchema,
      },
    },
  }
}
