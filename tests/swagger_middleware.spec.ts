import { test } from '@japa/runner'
import SwaggerMiddleware from '../src/middleware/swagger_middleware.js'
import type { OpenSwaggerConfig } from '../src/types.js'

/**
 * Create a minimal config for testing
 */
function createConfig(basicAuth?: OpenSwaggerConfig['basicAuth']): OpenSwaggerConfig {
  return {
    enabled: true,
    path: '/docs',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    scalar: {},
    routes: {},
    basicAuth,
  }
}

/**
 * Create a mock request object
 */
function createMockRequest(authHeader?: string) {
  return {
    header: (name: string) => {
      if (name.toLowerCase() === 'authorization') {
        return authHeader
      }
      return undefined
    },
    method: () => 'GET',
  }
}

/**
 * Create a mock response object
 */
function createMockResponse() {
  const headers: Record<string, string> = {}
  let statusCode = 200
  let body: any = null

  return {
    header: (name: string, value: string) => {
      headers[name] = value
      return this
    },
    status: (code: number) => {
      statusCode = code
      return {
        send: (data: any) => {
          body = data
        },
      }
    },
    send: (data: any) => {
      body = data
    },
    getHeaders: () => headers,
    getStatus: () => statusCode,
    getBody: () => body,
  }
}

/**
 * Create a mock HttpContext
 */
function createMockContext(authHeader?: string) {
  const response = createMockResponse()
  return {
    request: createMockRequest(authHeader),
    response,
    _response: response,
  }
}

/**
 * Encode credentials to base64 Basic auth format
 */
function encodeBasicAuth(username: string, password: string): string {
  const credentials = `${username}:${password}`
  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

test.group('SwaggerMiddleware - Basic Auth', () => {
  test('allows access when basicAuth is disabled', async ({ assert }) => {
    const config = createConfig()
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext()

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isTrue(nextCalled)
  })

  test('allows access when basicAuth is not configured', async ({ assert }) => {
    const config = createConfig(undefined)
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext()

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isTrue(nextCalled)
  })

  test('returns 401 when no Authorization header is provided', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext()

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
    assert.equal(ctx._response.getHeaders()['WWW-Authenticate'], 'Basic realm="API Documentation"')
  })

  test('returns 401 with custom realm', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
      realm: 'Custom Realm',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext()

    await middleware.handle(ctx as any, async () => {})

    assert.equal(ctx._response.getHeaders()['WWW-Authenticate'], 'Basic realm="Custom Realm"')
  })

  test('returns 401 when credentials are invalid', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext(encodeBasicAuth('wrong', 'credentials'))

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
  })

  test('returns 401 when only username is wrong', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext(encodeBasicAuth('wrong', 'secret'))

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
  })

  test('returns 401 when only password is wrong', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext(encodeBasicAuth('admin', 'wrong'))

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
  })

  test('allows access with valid credentials', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext(encodeBasicAuth('admin', 'secret'))

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isTrue(nextCalled)
  })

  test('handles password with colon character', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret:with:colons',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext(encodeBasicAuth('admin', 'secret:with:colons'))

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isTrue(nextCalled)
  })

  test('returns 401 for malformed Authorization header', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext('Bearer some-token')

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
  })

  test('returns 401 for invalid base64 encoding', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext('Basic not-valid-base64!!!')

    let nextCalled = false
    await middleware.handle(ctx as any, async () => {
      nextCalled = true
    })

    assert.isFalse(nextCalled)
  })

  test('adds security headers when auth passes', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext(encodeBasicAuth('admin', 'secret'))

    await middleware.handle(ctx as any, async () => {})

    const headers = ctx._response.getHeaders()
    assert.equal(headers['X-Content-Type-Options'], 'nosniff')
    assert.equal(headers['X-Frame-Options'], 'DENY')
    assert.equal(headers['X-XSS-Protection'], '1; mode=block')
  })

  test('adds CORS headers when auth passes', async ({ assert }) => {
    const config = createConfig({
      enabled: true,
      username: 'admin',
      password: 'secret',
    })
    const middleware = new SwaggerMiddleware(config)
    const ctx = createMockContext(encodeBasicAuth('admin', 'secret'))

    await middleware.handle(ctx as any, async () => {})

    const headers = ctx._response.getHeaders()
    assert.equal(headers['Access-Control-Allow-Origin'], '*')
    assert.equal(headers['Access-Control-Allow-Methods'], 'GET, OPTIONS')
    assert.equal(headers['Access-Control-Allow-Headers'], 'Content-Type, Authorization')
  })
})
