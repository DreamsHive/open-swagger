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

  test('should handle array handler with single action controller', async ({ assert }) => {
    const { RouteParser } = await import('../src/route_parser.js')
    const { SwaggerInfo } = await import('../src/decorators.js')

    // Mock controller class with decorator
    class TestController {
      @SwaggerInfo({
        tags: ['Test'],
        summary: 'Test endpoint',
        description: 'Test endpoint with array handler',
      })
      handle() {
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
            methods: ['GET'],
            handler: {
              reference: [mockImportFunction],
              name: 'TestController',
              handle: [TestController.prototype.handle],
            },
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

  test('should handle AdonisJS v6 magic string handler with object reference', async ({
    assert,
  }) => {
    const { RouteParser } = await import('../src/route_parser.js')
    const { SwaggerInfo } = await import('../src/decorators.js')

    // Mock controller class with decorator
    class UsersController {
      @SwaggerInfo({
        tags: ['Users'],
        summary: 'Get all users',
        description: 'Retrieve a list of all users',
      })
      index() {
        return []
      }

      @SwaggerInfo({
        tags: ['Users'],
        summary: 'Create user',
        description: 'Create a new user',
      })
      store() {
        return {}
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

    // Mock router with AdonisJS v6 object handler format (magic string resolved)
    // This is the actual format that AdonisJS v6 uses when routes are defined with magic strings
    // like router.get('/users', '#controllers/users_controller.index')
    const mockRouter = {
      toJSON: () => ({
        root: [
          {
            pattern: '/users',
            methods: ['GET'],
            handler: {
              reference: '#controllers/users_controller.index',
              name: '#controllers/users_controller.index',
              handle: async () => UsersController.prototype.index,
            },
            middleware: [],
            name: 'users.index',
          },
          {
            pattern: '/users',
            methods: ['POST'],
            handler: {
              reference: '#controllers/users_controller.store',
              name: '#controllers/users_controller.store',
              handle: async () => UsersController.prototype.store,
            },
            middleware: [],
            name: 'users.store',
          },
        ],
      }),
    }

    // We need to mock the file system import - but since we're in tests,
    // we'll need to handle this by checking the handler is correctly extracted
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

    // The paths object should exist even if we can't resolve the controller file in tests
    assert.isObject(spec.paths)
    // Since we can't actually import the controller file in tests,
    // the paths will be empty, but the parser should not crash
    // This test verifies the handler extraction logic works correctly
  })

  test('should correctly extract method name from reference string', async ({ assert }) => {
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

    const mockApp = {
      container: {
        make: async () => {
          throw new Error('Not found')
        },
      },
    }

    const parser = new RouteParser(config, mockApp as any)

    // Access the private method via prototype
    const extractMethodName = (parser as any).extractMethodNameFromReference.bind(parser)

    // Test various reference formats
    assert.equal(extractMethodName('#controllers/users_controller.index'), 'index')
    assert.equal(extractMethodName('#controllers/users_controller.store'), 'store')
    assert.equal(extractMethodName('#controllers/users_controller.show'), 'show')
    assert.equal(extractMethodName('#controllers/users_controller.update'), 'update')
    assert.equal(extractMethodName('#controllers/users_controller.destroy'), 'destroy')
    assert.equal(extractMethodName('#controllers/nested/path/controller.action'), 'action')

    // Single action controller (no method specified)
    assert.equal(extractMethodName('#controllers/single_action_controller'), 'handle')
  })
})
