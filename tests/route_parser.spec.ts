import { test } from '@japa/runner'

test.group('RouteParser - Array Handler Support', () => {
  test('should handle array handlers with import functions', async ({ assert }) => {
    const { RouteParser } = await import('../src/route_parser.js')
    const { SwaggerInfo } = await import('../src/decorators.js')

    // Mock controller class with decorator
    class TestController {
      @SwaggerInfo({
        tags: ['Test'],
        summary: 'Test endpoint',
        description: 'Test endpoint with array handler',
      })
      testMethod() {
        return 'test'
      }
    }

    // Mock import function
    const mockImportFunction = async () => ({ default: TestController })

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
    }

    // Mock router with array handler
    const mockRouter = {
      toJSON: () => ({
        root: [
          {
            pattern: '/test',
            method: 'GET',
            handler: [mockImportFunction, 'testMethod'],
            middleware: [],
            name: 'test',
          },
        ],
      }),
    }

    const mockApp = {
      container: {
        make: async (service: string) => {
          if (service === 'router') {
            return mockRouter
          }
          throw new Error(`Service ${service} not found`)
        },
      },
    }

    const parser = new RouteParser(config, mockApp as any)
    const spec = await parser.generateSpec()

    assert.isObject(spec.paths)
    assert.property(spec.paths, '/test')
    assert.property(spec.paths['/test'], 'get')
    assert.equal(spec.paths['/test'].get.summary, 'Test endpoint')
    assert.equal(spec.paths['/test'].get.description, 'Test endpoint with array handler')
    assert.deepEqual(spec.paths['/test'].get.tags, ['Test'])
  })

  test('should handle mixed string and array handlers', async ({ assert }) => {
    const { RouteParser } = await import('../src/route_parser.js')
    const { SwaggerInfo } = await import('../src/decorators.js')

    // Mock controller class with decorator
    class TestController {
      @SwaggerInfo({
        tags: ['Test'],
        summary: 'Array handler endpoint',
      })
      arrayMethod() {
        return 'array'
      }

      @SwaggerInfo({
        tags: ['Test'],
        summary: 'String handler endpoint',
      })
      stringMethod() {
        return 'string'
      }
    }

    // Mock import function
    const mockImportFunction = async () => ({ default: TestController })

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
    }

    // Mock router with both handler types
    const mockRouter = {
      toJSON: () => ({
        root: [
          {
            pattern: '/array-test',
            method: 'GET',
            handler: [mockImportFunction, 'arrayMethod'],
            middleware: [],
            name: 'array.test',
          },
          {
            pattern: '/string-test',
            method: 'POST',
            handler: '#controllers/test_controller.stringMethod',
            middleware: [],
            name: 'string.test',
          },
        ],
      }),
    }

    const mockApp = {
      container: {
        make: async (service: string) => {
          if (service === 'router') {
            return mockRouter
          }
          throw new Error(`Service ${service} not found`)
        },
      },
    }

    const parser = new RouteParser(config, mockApp as any)
    const spec = await parser.generateSpec()

    assert.isObject(spec.paths)

    // Check array handler route
    assert.property(spec.paths, '/array-test')
    assert.property(spec.paths['/array-test'], 'get')
    assert.equal(spec.paths['/array-test'].get.summary, 'Array handler endpoint')

    // String handler route should not be processed (no controller resolution in test)
    // but the paths object should still be valid
    assert.isObject(spec.paths)
  })

  test('should handle invalid array handlers gracefully', async ({ assert }) => {
    const { RouteParser } = await import('../src/route_parser.js')

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
    }

    // Mock router with invalid array handlers
    const mockRouter = {
      toJSON: () => ({
        root: [
          {
            pattern: '/invalid1',
            method: 'GET',
            handler: ['not-a-function', 'method'],
            middleware: [],
          },
          {
            pattern: '/invalid2',
            method: 'GET',
            handler: [() => import('#controllers/test'), 123], // number instead of string
            middleware: [],
          },
          {
            pattern: '/invalid3',
            method: 'GET',
            handler: [() => import('#controllers/test')], // only one element
            middleware: [],
          },
        ],
      }),
    }

    const mockApp = {
      container: {
        make: async (service: string) => {
          if (service === 'router') {
            return mockRouter
          }
          throw new Error(`Service ${service} not found`)
        },
      },
    }

    const parser = new RouteParser(config, mockApp as any)
    const spec = await parser.generateSpec()

    // Should not crash and should return empty paths (no valid routes with metadata)
    assert.isObject(spec.paths)
    assert.equal(Object.keys(spec.paths).length, 0)
  })

  test('should handle import function errors gracefully', async ({ assert }) => {
    const { RouteParser } = await import('../src/route_parser.js')

    // Mock import function that throws an error
    const mockImportFunction = async () => {
      throw new Error('Import failed')
    }

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
    }

    // Mock router with failing import function
    const mockRouter = {
      toJSON: () => ({
        root: [
          {
            pattern: '/failing-import',
            method: 'GET',
            handler: [mockImportFunction, 'testMethod'],
            middleware: [],
          },
        ],
      }),
    }

    const mockApp = {
      container: {
        make: async (service: string) => {
          if (service === 'router') {
            return mockRouter
          }
          throw new Error(`Service ${service} not found`)
        },
      },
    }

    const parser = new RouteParser(config, mockApp as any)
    const spec = await parser.generateSpec()

    // Should not crash and should return empty paths (no valid routes with metadata)
    assert.isObject(spec.paths)
    assert.equal(Object.keys(spec.paths).length, 0)
  })

  test('should handle array handlers with direct class reference', async ({ assert }) => {
    const { RouteParser } = await import('../src/route_parser.js')
    const { SwaggerInfo, SwaggerResponse } = await import('../src/decorators.js')

    // Mock controller class with decorators (like the user's GlobalController)
    class GlobalController {
      @SwaggerInfo({
        tags: ['Global'],
        summary: 'Health check',
        description: 'Verifica o status de saúde da aplicação.',
      })
      @SwaggerResponse(200, 'ok', {
        contentType: 'text/plain',
      })
      health() {
        return 'ok'
      }
    }

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
    }

    // Mock router with direct class reference (not an import function)
    const mockRouter = {
      toJSON: () => ({
        root: [
          {
            pattern: '/health',
            method: 'GET',
            handler: [GlobalController, 'health'],
            middleware: [],
            name: 'health',
          },
        ],
      }),
    }

    const mockApp = {
      container: {
        make: async (service: string) => {
          if (service === 'router') {
            return mockRouter
          }
          throw new Error(`Service ${service} not found`)
        },
      },
    }

    const parser = new RouteParser(config, mockApp as any)
    const spec = await parser.generateSpec()

    assert.isObject(spec.paths)
    assert.property(spec.paths, '/health')
    assert.property(spec.paths['/health'], 'get')
    assert.equal(spec.paths['/health'].get.summary, 'Health check')
    assert.equal(spec.paths['/health'].get.description, 'Verifica o status de saúde da aplicação.')
    assert.deepEqual(spec.paths['/health'].get.tags, ['Global'])
  })
})
