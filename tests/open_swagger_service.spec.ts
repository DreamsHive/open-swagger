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
})
