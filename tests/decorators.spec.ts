import { test } from '@japa/runner'

test.group('Swagger Decorators', () => {
  test('should work with SwaggerInfo decorator', async ({ assert }) => {
    const { SwaggerInfo, getSwaggerMetadata } = await import('../src/decorators.js')

    class TestController {
      @SwaggerInfo({
        tags: ['Users'],
        summary: 'Get all users',
        description: 'Retrieve a paginated list of all users with VineJS validation',
      })
      testMethod() {
        return 'test'
      }
    }

    const metadata = getSwaggerMetadata(TestController.prototype, 'testMethod')

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

    class TestController {
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

    const metadata = getSwaggerMetadata(TestController.prototype, 'testMethod')

    assert.isObject(metadata?.responses)
    assert.property(metadata?.responses, '200')
    assert.property(metadata?.responses, '400')
    assert.equal(metadata?.responses['200'].description, 'Success response')
    assert.equal(metadata?.responses['400'].description, 'Bad request')
  })

  test('should handle request body decorator', async ({ assert }) => {
    const { SwaggerRequestBody, getSwaggerMetadata } = await import('../src/decorators.js')

    class TestController {
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

    const metadata = getSwaggerMetadata(TestController.prototype, 'testMethod')

    assert.isObject(metadata?.requestBody)
    assert.equal(metadata?.requestBody.description, 'Request body description')
    assert.isTrue(metadata?.requestBody.required)
    assert.isObject(metadata?.requestBody.content)
  })

  test('should handle parameter decorator', async ({ assert }) => {
    const { SwaggerParameter, getSwaggerMetadata } = await import('../src/decorators.js')

    class TestController {
      @SwaggerParameter('id', 'path', { type: 'integer' }, true, 'User ID')
      @SwaggerParameter('page', 'query', { type: 'integer' }, false, 'Page number')
      testMethod() {
        return 'test'
      }
    }

    const metadata = getSwaggerMetadata(TestController.prototype, 'testMethod')

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

    class TestController {
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

    const metadata = getSwaggerMetadata(TestController.prototype, 'testMethod')

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

    class TestController {
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

    const metadata = getSwaggerMetadata(TestController.prototype, 'testMethod')

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
})
