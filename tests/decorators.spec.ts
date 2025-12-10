import { test } from '@japa/runner'

/**
 * Helper function to resolve metadata promises (similar to RouteParser.resolveMetadataPromises)
 */
async function resolveMetadataPromises(metadata: any): Promise<any> {
  if (!metadata) return metadata

  const resolved = { ...metadata }

  // Resolve response promises
  if (resolved.responses) {
    const responseEntries = Object.entries(resolved.responses)
    const resolvedResponses: Record<string, any> = {}

    for (const [status, responseData] of responseEntries) {
      if (responseData && typeof (responseData as any).then === 'function') {
        // It's a promise, resolve it
        resolvedResponses[status] = await (responseData as Promise<any>)
      } else {
        resolvedResponses[status] = responseData
      }
    }

    resolved.responses = resolvedResponses
  }

  // Resolve request body promise
  if (resolved.requestBody && typeof (resolved.requestBody as any).then === 'function') {
    resolved.requestBody = await (resolved.requestBody as Promise<any>)
  }

  // Resolve parameter promises
  if (resolved.parameters && Array.isArray(resolved.parameters)) {
    const resolvedParameters = []

    for (const param of resolved.parameters) {
      if (param && typeof (param as any).then === 'function') {
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
})
