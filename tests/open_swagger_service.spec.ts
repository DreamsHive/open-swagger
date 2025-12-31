import { test } from '@japa/runner'
import fc from 'fast-check'

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

  /**
   * Feature: swagger-cookie-auth-fix, Property 1: Default Values Are Applied
   * Validates: Requirements 1.4, 4.3
   */
  test('Property 1: Default values are applied when scalar options not set', async ({
    assert,
  }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1 }),
          version: fc.string({ minLength: 1 }),
        }),
        (info) => {
          const config = {
            enabled: true,
            path: '/docs',
            info: {
              title: info.title,
              version: info.version,
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
          const templateData = service.getScalarTemplateData('/api/spec')

          // Verify all default values
          assert.equal(templateData.withCredentials, true)
          assert.equal(templateData.searchHotKey, 'k')
          assert.equal(templateData.darkMode, false)
          assert.equal(templateData.hideDarkModeToggle, false)
          assert.equal(templateData.hideTestRequestButton, false)
          assert.equal(templateData.hideModels, false)
          assert.equal(templateData.hideSearch, false)
          assert.equal(templateData.persistAuth, false)
          assert.equal(templateData.showSidebar, true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: swagger-cookie-auth-fix, Property 2: Configuration Passthrough
   * Validates: Requirements 7.1, 7.3
   */
  test('Property 2: Configuration passthrough includes all set values', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    fc.assert(
      fc.property(
        fc.record({
          withCredentials: fc.boolean(),
          darkMode: fc.boolean(),
          hideDarkModeToggle: fc.boolean(),
          hideTestRequestButton: fc.boolean(),
          hideModels: fc.boolean(),
          hideSearch: fc.boolean(),
          searchHotKey: fc.string({ minLength: 1, maxLength: 1 }),
          proxyUrl: fc.option(fc.webUrl(), { nil: undefined }),
          persistAuth: fc.boolean(),
          showSidebar: fc.boolean(),
          configuration: fc.option(
            fc.record({
              customKey: fc.string(),
            }),
            { nil: undefined }
          ),
        }),
        (scalarConfig) => {
          const config = {
            enabled: true,
            path: '/docs',
            info: {
              title: 'Test API',
              version: '1.0.0',
            },
            scalar: scalarConfig,
            routes: {},
          }

          const mockApp = {
            container: {
              make: async () => ({}),
            },
          }

          const service = new OpenSwaggerService(config, mockApp as any)
          const templateData = service.getScalarTemplateData('/api/spec')

          // Verify all configured values are passed through
          assert.equal(templateData.withCredentials, scalarConfig.withCredentials)
          assert.equal(templateData.darkMode, scalarConfig.darkMode)
          assert.equal(templateData.hideDarkModeToggle, scalarConfig.hideDarkModeToggle)
          assert.equal(templateData.hideTestRequestButton, scalarConfig.hideTestRequestButton)
          assert.equal(templateData.hideModels, scalarConfig.hideModels)
          assert.equal(templateData.hideSearch, scalarConfig.hideSearch)
          assert.equal(templateData.searchHotKey, scalarConfig.searchHotKey)
          assert.equal(templateData.proxyUrl, scalarConfig.proxyUrl || '')
          assert.equal(templateData.persistAuth, scalarConfig.persistAuth)
          assert.equal(templateData.showSidebar, scalarConfig.showSidebar)

          // Verify additionalConfig contains configuration object
          if (scalarConfig.configuration) {
            assert.deepEqual(templateData.additionalConfig, scalarConfig.configuration)
          } else {
            assert.deepEqual(templateData.additionalConfig, {})
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Unit test for type definitions
   * Validates: Requirements 1.1, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 5.1, 6.1
   */
  test('Type definitions: all new scalar options compile correctly', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    // This test verifies that all new options are accepted by the config
    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {
        withCredentials: true,
        darkMode: true,
        hideDarkModeToggle: true,
        hideTestRequestButton: true,
        hideModels: true,
        hideSearch: true,
        searchHotKey: 'j',
        proxyUrl: 'https://proxy.example.com',
        persistAuth: true,
        configuration: { customOption: 'value' },
      },
      routes: {},
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // All options should be present in template data
    assert.equal(templateData.withCredentials, true)
    assert.equal(templateData.darkMode, true)
    assert.equal(templateData.hideDarkModeToggle, true)
    assert.equal(templateData.hideTestRequestButton, true)
    assert.equal(templateData.hideModels, true)
    assert.equal(templateData.hideSearch, true)
    assert.equal(templateData.searchHotKey, 'j')
    assert.equal(templateData.proxyUrl, 'https://proxy.example.com')
    assert.equal(templateData.persistAuth, true)
    assert.deepEqual(templateData.additionalConfig, { customOption: 'value' })
  })

  /**
   * Edge case tests
   * Validates: Requirements 7.1
   */
  test('Edge case: empty scalar config uses all defaults', async ({ assert }) => {
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
    const templateData = service.getScalarTemplateData('/api/spec')

    assert.equal(templateData.withCredentials, true)
    assert.equal(templateData.darkMode, false)
    assert.equal(templateData.searchHotKey, 'k')
    assert.deepEqual(templateData.additionalConfig, {})
  })

  test('Edge case: partial scalar config merges with defaults', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {
        darkMode: true,
        // Other options not set
      },
      routes: {},
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // Set value should be used
    assert.equal(templateData.darkMode, true)
    // Defaults should apply for unset values
    assert.equal(templateData.withCredentials, true)
    assert.equal(templateData.searchHotKey, 'k')
  })

  test('Edge case: undefined values are treated as unset', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {
        withCredentials: undefined,
        darkMode: undefined,
      },
      routes: {},
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // Defaults should apply for undefined values
    assert.equal(templateData.withCredentials, true)
    assert.equal(templateData.darkMode, false)
  })

  test('Edge case: withCredentials false is respected', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {
        withCredentials: false,
      },
      routes: {},
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // Explicit false should be respected
    assert.equal(templateData.withCredentials, false)
  })

  test('Edge case: showSidebar false is respected', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {
        showSidebar: false,
      },
      routes: {},
    }

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // Explicit false should be respected
    assert.equal(templateData.showSidebar, false)
  })
})
