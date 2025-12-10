import { test } from '@japa/runner'

test.group('OpenSwaggerService', () => {
  test('should create service instance', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {},
      routes: {},
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    assert.isTrue(service.isEnabled())
    assert.equal(service.getPath(), '/docs')
  })

  test('should generate basic OpenAPI spec', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test API Description',
      },
      scalar: {},
      routes: {
        autoScan: false, // Disable auto-scan for this test
      },
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const spec = await service.generateSpec()

    assert.equal(spec.openapi, '3.0.3')
    assert.equal(spec.info.title, 'Test API')
    assert.equal(spec.info.version, '1.0.0')
    assert.equal(spec.info.description, 'Test API Description')
    assert.isObject(spec.paths)
  })

  test('should merge custom specification', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {},
      routes: {
        autoScan: false,
      },
      customSpec: {
        paths: {
          '/custom': {
            get: {
              summary: 'Custom endpoint',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
      },
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const spec = await service.generateSpec()

    assert.property(spec.paths, '/custom')
    assert.property(spec.paths['/custom'], 'get')
    assert.equal(spec.paths['/custom'].get.summary, 'Custom endpoint')
  })

  test('should handle components configuration gracefully when path does not exist', async ({
    assert,
  }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {},
      routes: {
        autoScan: false,
      },
      components: {
        include: ['/non-existent-path/schemas.ts'],
      },
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
      appRoot: {
        toString: () => process.cwd(),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const spec = await service.generateSpec()

    // Should not crash and should generate basic spec
    assert.equal(spec.openapi, '3.0.3')
    assert.equal(spec.info.title, 'Test API')
    assert.isObject(spec.paths)
    // Components should be undefined or empty since path doesn't exist
    assert.isUndefined(spec.components?.schemas || undefined)
  })

  test('should include cookie authentication security scheme', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {},
      routes: {
        autoScan: false,
      },
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey' as const,
          in: 'cookie' as const,
          name: 'session',
          description: 'Session cookie for authentication',
        },
      },
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const spec = await service.generateSpec()

    assert.isObject(spec.components?.securitySchemes)
    assert.property(spec.components?.securitySchemes, 'cookieAuth')
    assert.equal(spec.components?.securitySchemes?.cookieAuth.type, 'apiKey')
    assert.equal(spec.components?.securitySchemes?.cookieAuth.in, 'cookie')
    assert.equal(spec.components?.securitySchemes?.cookieAuth.name, 'session')
  })

  test('should include bearer token security scheme', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {},
      routes: {
        autoScan: false,
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http' as const,
          scheme: 'bearer' as const,
          bearerFormat: 'JWT',
          description: 'JWT Bearer token',
        },
      },
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const spec = await service.generateSpec()

    assert.isObject(spec.components?.securitySchemes)
    assert.property(spec.components?.securitySchemes, 'bearerAuth')
    assert.equal(spec.components?.securitySchemes?.bearerAuth.type, 'http')
    assert.equal(spec.components?.securitySchemes?.bearerAuth.scheme, 'bearer')
    assert.equal(spec.components?.securitySchemes?.bearerAuth.bearerFormat, 'JWT')
  })

  test('should include multiple security schemes', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {},
      routes: {
        autoScan: false,
      },
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey' as const,
          in: 'cookie' as const,
          name: 'session',
        },
        bearerAuth: {
          type: 'http' as const,
          scheme: 'bearer' as const,
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey' as const,
          in: 'header' as const,
          name: 'X-API-Key',
        },
        basicAuth: {
          type: 'http' as const,
          scheme: 'basic' as const,
        },
      },
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const spec = await service.generateSpec()

    assert.isObject(spec.components?.securitySchemes)
    assert.property(spec.components?.securitySchemes, 'cookieAuth')
    assert.property(spec.components?.securitySchemes, 'bearerAuth')
    assert.property(spec.components?.securitySchemes, 'apiKeyAuth')
    assert.property(spec.components?.securitySchemes, 'basicAuth')

    // Verify cookie auth
    assert.equal(spec.components?.securitySchemes?.cookieAuth.in, 'cookie')

    // Verify API key auth
    assert.equal(spec.components?.securitySchemes?.apiKeyAuth.in, 'header')

    // Verify basic auth
    assert.equal(spec.components?.securitySchemes?.basicAuth.scheme, 'basic')
  })

  test('should include global security requirements', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {},
      routes: {
        autoScan: false,
      },
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey' as const,
          in: 'cookie' as const,
          name: 'session',
        },
      },
      security: [{ cookieAuth: [] }],
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const spec = await service.generateSpec()

    assert.isArray(spec.security)
    assert.lengthOf(spec.security!, 1)
    assert.deepEqual(spec.security![0], { cookieAuth: [] })
  })

  test('should include OAuth2 security scheme with scopes', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {},
      routes: {
        autoScan: false,
      },
      securitySchemes: {
        oauth2Auth: {
          type: 'oauth2' as const,
          description: 'OAuth2 authentication',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://example.com/oauth/authorize',
              tokenUrl: 'https://example.com/oauth/token',
              scopes: {
                'read:users': 'Read user information',
                'write:users': 'Modify user information',
              },
            },
          },
        },
      },
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const spec = await service.generateSpec()

    assert.isObject(spec.components?.securitySchemes)
    assert.property(spec.components?.securitySchemes, 'oauth2Auth')
    assert.equal(spec.components?.securitySchemes?.oauth2Auth.type, 'oauth2')
    assert.isObject(spec.components?.securitySchemes?.oauth2Auth.flows)
    assert.isObject(spec.components?.securitySchemes?.oauth2Auth.flows.authorizationCode)
    assert.equal(
      spec.components?.securitySchemes?.oauth2Auth.flows.authorizationCode.authorizationUrl,
      'https://example.com/oauth/authorize'
    )
    assert.property(
      spec.components?.securitySchemes?.oauth2Auth.flows.authorizationCode.scopes,
      'read:users'
    )
  })
})
