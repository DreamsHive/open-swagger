import { test } from '@japa/runner'
import {
  convertToJsonSchema,
  createResponseSchema,
  createRequestBodySchema,
} from '../src/schema_utils.js'
import { RAW_METADATA_MARKER, getGlobalValidator } from '../src/decorators.js'

/**
 * Check if an object contains raw metadata that needs conversion
 */
function isRawMetadata(obj: any): boolean {
  return obj && typeof obj === 'object' && obj[RAW_METADATA_MARKER] === true
}

/**
 * Helper function to resolve raw metadata (similar to RouteParser.resolveMetadataPromises)
 * This converts raw schema data to OpenAPI format at test time
 */
async function resolveMetadataPromises(metadata: any): Promise<any> {
  if (!metadata) return metadata

  const resolved = { ...metadata }
  const validator = getGlobalValidator()

  // Convert raw response metadata to OpenAPI format
  if (resolved.responses) {
    const responseEntries = Object.entries(resolved.responses)
    const resolvedResponses: Record<string, any> = {}

    for (const [status, responseData] of responseEntries) {
      if (isRawMetadata(responseData)) {
        // Convert raw schema to OpenAPI response format
        const raw = responseData as any
        const responseSchema = raw.schema
          ? await createResponseSchema(raw.schema, validator)
          : undefined

        resolvedResponses[status] = {
          description: raw.description,
          ...responseSchema,
        }
      } else if (responseData && typeof (responseData as any).then === 'function') {
        // Legacy: handle promises (backward compatibility)
        resolvedResponses[status] = await (responseData as Promise<any>)
      } else {
        resolvedResponses[status] = responseData
      }
    }

    resolved.responses = resolvedResponses
  }

  // Convert raw request body metadata to OpenAPI format
  if (resolved.requestBody) {
    if (isRawMetadata(resolved.requestBody)) {
      const raw = resolved.requestBody as any
      const bodySchema = await createRequestBodySchema(raw.schema, validator, raw.contentType)

      resolved.requestBody = {
        description: raw.description,
        required: raw.required,
        ...bodySchema,
      }
    } else if (typeof (resolved.requestBody as any).then === 'function') {
      // Legacy: handle promises (backward compatibility)
      resolved.requestBody = await (resolved.requestBody as Promise<any>)
    }
  }

  // Convert raw parameter metadata to OpenAPI format
  if (resolved.parameters && Array.isArray(resolved.parameters)) {
    const resolvedParameters = []

    for (const param of resolved.parameters) {
      if (isRawMetadata(param)) {
        // Convert raw schema to OpenAPI parameter format
        const raw = param as any
        const convertedSchema = await convertToJsonSchema(raw.schema, validator)

        resolvedParameters.push({
          name: raw.name,
          in: raw.in,
          required: raw.required,
          schema: convertedSchema,
          description: raw.description,
        })
      } else if (param && typeof (param as any).then === 'function') {
        // Legacy: handle promises (backward compatibility)
        resolvedParameters.push(await (param as Promise<any>))
      } else {
        resolvedParameters.push(param)
      }
    }

    resolved.parameters = resolvedParameters
  }

  return resolved
}

test.group('Swagger Decorators', () => {
  test('should work with SwaggerInfo decorator', async ({ assert }) => {
    const { SwaggerInfo, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerInfoTestController {
      @SwaggerInfo({
        tags: ['Users'],
        summary: 'Get all users',
        description: 'Retrieve a paginated list of all users with VineJS validation',
      })
      testMethod() {
        return 'test'
      }
    }

    const metadata = getSwaggerMetadata(SwaggerInfoTestController.prototype, 'testMethod')

    assert.isObject(metadata)
    assert.equal(metadata?.summary, 'Get all users')
    assert.equal(
      metadata?.description,
      'Retrieve a paginated list of all users with VineJS validation'
    )
    assert.deepEqual(metadata?.tags, ['Users'])
  })

  test('should handle response decorator', async ({ assert }) => {
    const { SwaggerResponse, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerResponseTestController {
      @SwaggerResponse(200, 'Success response', {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      })
      @SwaggerResponse(400, 'Bad request')
      testMethod() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(SwaggerResponseTestController.prototype, 'testMethod')
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isObject(metadata?.responses)
    assert.property(metadata?.responses, '200')
    assert.property(metadata?.responses, '400')
    assert.equal(metadata?.responses['200'].description, 'Success response')
    assert.equal(metadata?.responses['400'].description, 'Bad request')
  })

  test('should handle request body decorator', async ({ assert }) => {
    const { SwaggerRequestBody, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerRequestBodyTestController {
      @SwaggerRequestBody('Request body description', {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })
      testMethod() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(SwaggerRequestBodyTestController.prototype, 'testMethod')
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isObject(metadata?.requestBody)
    assert.equal(metadata?.requestBody.description, 'Request body description')
    assert.isTrue(metadata?.requestBody.required)
    assert.isObject(metadata?.requestBody.content)
  })

  test('should handle parameter decorator', async ({ assert }) => {
    const { SwaggerParameter, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerParameterTestController {
      @SwaggerParameter('id', 'path', { type: 'integer' }, true, 'User ID')
      @SwaggerParameter('page', 'query', { type: 'integer' }, false, 'Page number')
      testMethod() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(SwaggerParameterTestController.prototype, 'testMethod')
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isArray(metadata?.parameters)
    assert.lengthOf(metadata?.parameters, 2)

    const pathParam = metadata?.parameters.find((p) => p.name === 'id')
    const queryParam = metadata?.parameters.find((p) => p.name === 'page')

    assert.equal(pathParam?.in, 'path')
    assert.isTrue(pathParam?.required)
    assert.equal(queryParam?.in, 'query')
    assert.isFalse(queryParam?.required)
  })

  test('should handle SwaggerParam decorator', async ({ assert }) => {
    const { SwaggerParam, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerParamTestController {
      @SwaggerParam(
        {
          name: 'id',
          location: 'path',
          description: 'User ID',
        },
        { type: 'integer' },
        true
      )
      @SwaggerParam(
        {
          name: 'page',
          location: 'query',
          description: 'Page number',
        },
        { type: 'integer' }
      )
      testMethod() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(SwaggerParamTestController.prototype, 'testMethod')
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isArray(metadata?.parameters)
    assert.lengthOf(metadata?.parameters, 2)

    const pathParam = metadata?.parameters.find((p) => p.name === 'id')
    const queryParam = metadata?.parameters.find((p) => p.name === 'page')

    assert.equal(pathParam?.in, 'path')
    assert.isTrue(pathParam?.required)
    assert.equal(pathParam?.description, 'User ID')
    assert.equal(queryParam?.in, 'query')
    assert.isFalse(queryParam?.required)
    assert.equal(queryParam?.description, 'Page number')
  })

  test('should handle SwaggerHeader decorator', async ({ assert }) => {
    const { SwaggerHeader, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerHeaderTestController {
      @SwaggerHeader(
        {
          name: 'Authorization',
          description: 'Bearer token for authentication',
        },
        { type: 'string' },
        true
      )
      @SwaggerHeader(
        {
          name: 'X-API-Version',
          description: 'API version',
        },
        { type: 'string' }
      )
      testMethod() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(SwaggerHeaderTestController.prototype, 'testMethod')
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isArray(metadata?.parameters)
    assert.lengthOf(metadata?.parameters, 2)

    const authHeader = metadata?.parameters.find((p) => p.name === 'Authorization')
    const versionHeader = metadata?.parameters.find((p) => p.name === 'X-API-Version')

    assert.equal(authHeader?.in, 'header')
    assert.isTrue(authHeader?.required)
    assert.equal(authHeader?.description, 'Bearer token for authentication')
    assert.equal(versionHeader?.in, 'header')
    assert.isFalse(versionHeader?.required)
    assert.equal(versionHeader?.description, 'API version')
  })

  test('should handle SwaggerSecurity decorator with cookie auth', async ({ assert }) => {
    const { SwaggerSecurity, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerSecurityTestController {
      @SwaggerSecurity([{ cookieAuth: [] }])
      testMethodWithCookieAuth() {
        return 'test'
      }
    }

    const metadata = getSwaggerMetadata(
      SwaggerSecurityTestController.prototype,
      'testMethodWithCookieAuth'
    )

    assert.isArray(metadata?.security)
    assert.lengthOf(metadata?.security, 1)
    assert.deepEqual(metadata?.security[0], { cookieAuth: [] })
  })

  test('should handle SwaggerSecurity decorator with bearer auth', async ({ assert }) => {
    const { SwaggerSecurity, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerSecurityBearerTestController {
      @SwaggerSecurity([{ bearerAuth: [] }])
      testMethodWithBearerAuth() {
        return 'test'
      }
    }

    const metadata = getSwaggerMetadata(
      SwaggerSecurityBearerTestController.prototype,
      'testMethodWithBearerAuth'
    )

    assert.isArray(metadata?.security)
    assert.lengthOf(metadata?.security, 1)
    assert.deepEqual(metadata?.security[0], { bearerAuth: [] })
  })

  test('should handle SwaggerSecurity decorator with OAuth2 scopes', async ({ assert }) => {
    const { SwaggerSecurity, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerSecurityOAuth2TestController {
      @SwaggerSecurity([{ oauth2Auth: ['read:users', 'write:users'] }])
      testMethodWithOAuth2() {
        return 'test'
      }
    }

    const metadata = getSwaggerMetadata(
      SwaggerSecurityOAuth2TestController.prototype,
      'testMethodWithOAuth2'
    )

    assert.isArray(metadata?.security)
    assert.lengthOf(metadata?.security, 1)
    assert.deepEqual(metadata?.security[0], { oauth2Auth: ['read:users', 'write:users'] })
  })

  test('should handle SwaggerSecurity decorator with multiple security schemes', async ({
    assert,
  }) => {
    const { SwaggerSecurity, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerSecurityMultipleTestController {
      @SwaggerSecurity([{ cookieAuth: [] }, { bearerAuth: [] }])
      testMethodWithMultipleSecurity() {
        return 'test'
      }
    }

    const metadata = getSwaggerMetadata(
      SwaggerSecurityMultipleTestController.prototype,
      'testMethodWithMultipleSecurity'
    )

    assert.isArray(metadata?.security)
    assert.lengthOf(metadata?.security, 2)
    assert.deepEqual(metadata?.security[0], { cookieAuth: [] })
    assert.deepEqual(metadata?.security[1], { bearerAuth: [] })
  })

  test('should handle SwaggerSecurity decorator with empty array (public endpoint)', async ({
    assert,
  }) => {
    const { SwaggerSecurity, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerSecurityPublicTestController {
      @SwaggerSecurity([])
      testMethodPublic() {
        return 'test'
      }
    }

    const metadata = getSwaggerMetadata(
      SwaggerSecurityPublicTestController.prototype,
      'testMethodPublic'
    )

    assert.isArray(metadata?.security)
    assert.lengthOf(metadata?.security, 0)
  })

  test('should handle SwaggerDeprecated decorator', async ({ assert }) => {
    const { SwaggerDeprecated, getSwaggerMetadata } = await import('../src/decorators.js')

    class SwaggerDeprecatedTestController {
      @SwaggerDeprecated(true)
      testMethodDeprecated() {
        return 'test'
      }

      @SwaggerDeprecated(false)
      testMethodNotDeprecated() {
        return 'test'
      }
    }

    const metadataDeprecated = getSwaggerMetadata(
      SwaggerDeprecatedTestController.prototype,
      'testMethodDeprecated'
    )
    const metadataNotDeprecated = getSwaggerMetadata(
      SwaggerDeprecatedTestController.prototype,
      'testMethodNotDeprecated'
    )

    assert.isTrue(metadataDeprecated?.deprecated)
    assert.isFalse(metadataNotDeprecated?.deprecated)
  })

  test('should handle SwaggerRequestBody with contentType option (multipart/form-data)', async ({
    assert,
  }) => {
    const { SwaggerRequestBody, getSwaggerMetadata } = await import('../src/decorators.js')

    class FileUploadTestController {
      @SwaggerRequestBody(
        'File upload',
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
            file: { type: 'string', format: 'binary' },
          },
        },
        { contentType: 'multipart/form-data' }
      )
      testMethodWithFileUpload() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(
      FileUploadTestController.prototype,
      'testMethodWithFileUpload'
    )
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isObject(metadata?.requestBody)
    assert.equal(metadata?.requestBody.description, 'File upload')
    assert.isTrue(metadata?.requestBody.required)
    assert.property(metadata?.requestBody.content, 'multipart/form-data')
    assert.notProperty(metadata?.requestBody.content, 'application/json')
  })

  test('should handle SwaggerRequestBody with legacy boolean required=false parameter', async ({
    assert,
  }) => {
    const { SwaggerRequestBody, getSwaggerMetadata } = await import('../src/decorators.js')

    class LegacyRequestBodyTestController {
      @SwaggerRequestBody(
        'User data',
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        false // Legacy: required = false
      )
      testMethodLegacy() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(
      LegacyRequestBodyTestController.prototype,
      'testMethodLegacy'
    )
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isObject(metadata?.requestBody)
    assert.isFalse(metadata?.requestBody.required)
    assert.property(metadata?.requestBody.content, 'application/json')
  })

  test('should handle SwaggerRequestBody with legacy boolean required=true parameter', async ({
    assert,
  }) => {
    const { SwaggerRequestBody, getSwaggerMetadata } = await import('../src/decorators.js')

    class LegacyBooleanTrueTestController {
      @SwaggerRequestBody(
        'User data',
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        true // Legacy: required = true
      )
      testMethodLegacyTrue() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(
      LegacyBooleanTrueTestController.prototype,
      'testMethodLegacyTrue'
    )
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isObject(metadata?.requestBody)
    assert.isTrue(metadata?.requestBody.required)
    assert.property(metadata?.requestBody.content, 'application/json')
  })

  test('should handle SwaggerRequestBody with required: false in options', async ({ assert }) => {
    const { SwaggerRequestBody, getSwaggerMetadata } = await import('../src/decorators.js')

    class OptionalRequestBodyTestController {
      @SwaggerRequestBody(
        'Optional data',
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        { required: false, contentType: 'application/json' }
      )
      testMethodOptional() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(
      OptionalRequestBodyTestController.prototype,
      'testMethodOptional'
    )
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isObject(metadata?.requestBody)
    assert.isFalse(metadata?.requestBody.required)
  })

  test('should handle SwaggerRequestBody with application/x-www-form-urlencoded', async ({
    assert,
  }) => {
    const { SwaggerRequestBody, getSwaggerMetadata } = await import('../src/decorators.js')

    class FormUrlEncodedTestController {
      @SwaggerRequestBody(
        'Form data',
        {
          type: 'object',
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
        { contentType: 'application/x-www-form-urlencoded' }
      )
      testMethodFormUrlEncoded() {
        return 'test'
      }
    }

    const rawMetadata = getSwaggerMetadata(
      FormUrlEncodedTestController.prototype,
      'testMethodFormUrlEncoded'
    )
    const metadata = await resolveMetadataPromises(rawMetadata)

    assert.isObject(metadata?.requestBody)
    assert.property(metadata?.requestBody.content, 'application/x-www-form-urlencoded')
    assert.notProperty(metadata?.requestBody.content, 'application/json')
    assert.notProperty(metadata?.requestBody.content, 'multipart/form-data')
  })
})

test.group('File Helpers', () => {
  test('openapiFile should create single file schema', async ({ assert }) => {
    const { openapiFile } = await import('../src/file_helpers.js')

    const schema = openapiFile({ description: 'CSV file with customers' })

    assert.equal(schema.type, 'string')
    assert.equal(schema.format, 'binary')
    assert.equal(schema.description, 'CSV file with customers')
  })

  test('openapiFile should create multiple files schema', async ({ assert }) => {
    const { openapiFile } = await import('../src/file_helpers.js')

    const schema = openapiFile({ description: 'Attachment files', multiple: true })

    assert.equal(schema.type, 'array')
    assert.deepEqual(schema.items, { type: 'string', format: 'binary' })
    assert.equal(schema.description, 'Attachment files')
  })

  test('openapiFile should support minItems and maxItems for multiple files', async ({
    assert,
  }) => {
    const { openapiFile } = await import('../src/file_helpers.js')

    const schema = openapiFile({
      description: 'Gallery images',
      multiple: true,
      minItems: 2,
      maxItems: 10,
    })

    assert.equal(schema.type, 'array')
    assert.equal(schema.minItems, 2)
    assert.equal(schema.maxItems, 10)
  })

  test('vineFile should be an alias for openapiFile', async ({ assert }) => {
    const { vineFile, openapiFile } = await import('../src/file_helpers.js')

    const vineSchema = vineFile({ description: 'Test file' })
    const openapiSchema = openapiFile({ description: 'Test file' })

    assert.equal(vineSchema.type, openapiSchema.type)
    assert.equal(vineSchema.format, openapiSchema.format)
    assert.equal(vineSchema.description, openapiSchema.description)
  })

  test('typeboxFile should be an alias for openapiFile', async ({ assert }) => {
    const { typeboxFile, openapiFile } = await import('../src/file_helpers.js')

    const typeboxSchema = typeboxFile({ description: 'Test file' })
    const openapiSchema = openapiFile({ description: 'Test file' })

    assert.equal(typeboxSchema.type, openapiSchema.type)
    assert.equal(typeboxSchema.format, openapiSchema.format)
  })

  test('zodFile should be an alias for openapiFile', async ({ assert }) => {
    const { zodFile, openapiFile } = await import('../src/file_helpers.js')

    const zodSchema = zodFile({ description: 'Test file' })
    const openapiSchema = openapiFile({ description: 'Test file' })

    assert.equal(zodSchema.type, openapiSchema.type)
    assert.equal(zodSchema.format, openapiSchema.format)
  })

  test('isFileSchema should correctly identify file schemas', async ({ assert }) => {
    const { openapiFile, isFileSchema } = await import('../src/file_helpers.js')

    const fileSchema = openapiFile({ description: 'Test file' })
    const regularSchema = { type: 'string' }

    assert.isTrue(isFileSchema(fileSchema))
    assert.isFalse(isFileSchema(regularSchema))
    // isFileSchema returns false for null/undefined
    assert.equal(isFileSchema(null), false)
    assert.equal(isFileSchema(undefined), false)
  })

  test('toOpenAPIFileSchema should remove internal marker', async ({ assert }) => {
    const { openapiFile, toOpenAPIFileSchema, FILE_SCHEMA_SYMBOL } =
      await import('../src/file_helpers.js')

    const fileSchema = openapiFile({ description: 'Test file' })
    const cleanSchema = toOpenAPIFileSchema(fileSchema)

    assert.equal(cleanSchema.type, 'string')
    assert.equal(cleanSchema.format, 'binary')
    assert.equal(cleanSchema.description, 'Test file')
    // Check that the symbol is not present in the clean schema
    assert.isUndefined(cleanSchema[FILE_SCHEMA_SYMBOL])
  })
})
