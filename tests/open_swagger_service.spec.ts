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
   * For any OpenSwaggerConfig where scalar options are not explicitly set,
   * the getScalarTemplateData() method SHALL return the correct default values.
   * Validates: Requirements 1.4, 4.3
   */
  test('Property 1: Default values are applied when scalar options not set', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    await fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1 }),
          version: fc.string({ minLength: 1 }),
          description: fc.option(fc.string(), { nil: undefined }),
        }),
        (info) => {
          const config = {
            enabled: true,
            path: '/docs',
            info: {
              title: info.title,
              version: info.version,
              description: info.description,
            },
            scalar: {}, // Empty scalar config - should use defaults
            routes: {},
          }

          const service = new OpenSwaggerService(config, mockApp as any)
          const templateData = service.getScalarTemplateData('/api/spec')

          // Verify all default values
          assert.equal(templateData.withCredentials, true, 'withCredentials should default to true')
          assert.equal(templateData.searchHotKey, 'k', 'searchHotKey should default to k')
          assert.equal(templateData.darkMode, false, 'darkMode should default to false')
          assert.equal(
            templateData.hideDarkModeToggle,
            false,
            'hideDarkModeToggle should default to false'
          )
          assert.equal(
            templateData.hideTestRequestButton,
            false,
            'hideTestRequestButton should default to false'
          )
          assert.equal(templateData.hideModels, false, 'hideModels should default to false')
          assert.equal(templateData.hideSearch, false, 'hideSearch should default to false')
          assert.equal(templateData.persistAuth, false, 'persistAuth should default to false')
          assert.equal(templateData.showSidebar, true, 'showSidebar should default to true')
          assert.equal(templateData.theme, 'auto', 'theme should default to auto')
          assert.equal(templateData.layout, 'modern', 'layout should default to modern')
          assert.deepEqual(
            templateData.additionalConfig,
            {},
            'additionalConfig should default to empty object'
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: swagger-cookie-auth-fix, Property 2: Configuration Passthrough
   * For any OpenSwaggerConfig with scalar options set, the getScalarTemplateData() method
   * SHALL include all configured values in the returned template data object, and the
   * additionalConfig field SHALL contain the contents of scalar.configuration.
   * Validates: Requirements 7.1, 7.3
   */
  test('Property 2: Configuration passthrough includes all set values', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    await fc.assert(
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
          theme: fc.constantFrom(
            'auto',
            'alternate',
            'default',
            'moon',
            'purple',
            'solarized'
          ) as fc.Arbitrary<'auto' | 'alternate' | 'default' | 'moon' | 'purple' | 'solarized'>,
          layout: fc.constantFrom('modern', 'classic') as fc.Arbitrary<'modern' | 'classic'>,
          customCss: fc.option(fc.string(), { nil: undefined }),
          configuration: fc.dictionary(fc.string(), fc.jsonValue()),
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
          assert.equal(templateData.theme, scalarConfig.theme)
          assert.equal(templateData.layout, scalarConfig.layout)
          assert.equal(templateData.customCss, scalarConfig.customCss || '')

          // Verify additionalConfig contains scalar.configuration
          assert.deepEqual(templateData.additionalConfig, scalarConfig.configuration)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Unit tests for type definitions - Task 5.1
   * Tests that new scalar configuration options compile correctly
   * Requirements: 1.1, 2.1, 2.2, 3.1, 3.2, 3.3, 4.1, 5.1, 6.1
   */
  test('Type definitions: all new scalar options compile correctly', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    // Test that all new typed options are accepted by the config
    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {
        // Requirement 1.1: withCredentials option
        withCredentials: true,
        // Requirement 2.1: darkMode option
        darkMode: true,
        // Requirement 2.2: hideDarkModeToggle option
        hideDarkModeToggle: true,
        // Requirement 3.1: hideTestRequestButton option
        hideTestRequestButton: true,
        // Requirement 3.2: hideModels option
        hideModels: true,
        // Requirement 3.3: hideSearch option
        hideSearch: true,
        // Requirement 4.1: searchHotKey option
        searchHotKey: 'j',
        // Requirement 5.1: proxyUrl option
        proxyUrl: 'https://proxy.example.com',
        // Requirement 6.1: persistAuth option
        persistAuth: true,
        // Existing options
        theme: 'moon' as const,
        layout: 'classic' as const,
        showSidebar: false,
        customCss: '.custom { color: red; }',
        configuration: { customOption: 'value' },
      },
      routes: {},
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // Verify all options are passed through correctly
    assert.equal(templateData.withCredentials, true)
    assert.equal(templateData.darkMode, true)
    assert.equal(templateData.hideDarkModeToggle, true)
    assert.equal(templateData.hideTestRequestButton, true)
    assert.equal(templateData.hideModels, true)
    assert.equal(templateData.hideSearch, true)
    assert.equal(templateData.searchHotKey, 'j')
    assert.equal(templateData.proxyUrl, 'https://proxy.example.com')
    assert.equal(templateData.persistAuth, true)
    assert.equal(templateData.theme, 'moon')
    assert.equal(templateData.layout, 'classic')
    assert.equal(templateData.showSidebar, false)
    assert.equal(templateData.customCss, '.custom { color: red; }')
    assert.deepEqual(templateData.additionalConfig, { customOption: 'value' })
  })

  /**
   * Unit tests for edge cases - Task 5.2
   * Tests empty config, partial config, and null/undefined values
   * Requirements: 7.1
   */
  test('Edge case: empty scalar config uses all defaults', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

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

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // All defaults should be applied
    assert.equal(templateData.withCredentials, true)
    assert.equal(templateData.darkMode, false)
    assert.equal(templateData.hideDarkModeToggle, false)
    assert.equal(templateData.hideTestRequestButton, false)
    assert.equal(templateData.hideModels, false)
    assert.equal(templateData.hideSearch, false)
    assert.equal(templateData.searchHotKey, 'k')
    assert.equal(templateData.proxyUrl, '')
    assert.equal(templateData.persistAuth, false)
    assert.equal(templateData.theme, 'auto')
    assert.equal(templateData.layout, 'modern')
    assert.equal(templateData.showSidebar, true)
    assert.equal(templateData.customCss, '')
    assert.deepEqual(templateData.additionalConfig, {})
  })

  test('Edge case: partial scalar config merges with defaults', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

    // Only set some options, others should use defaults
    const config = {
      enabled: true,
      path: '/docs',
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      scalar: {
        darkMode: true,
        hideModels: true,
        searchHotKey: 'f',
      },
      routes: {},
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // Explicitly set values
    assert.equal(templateData.darkMode, true)
    assert.equal(templateData.hideModels, true)
    assert.equal(templateData.searchHotKey, 'f')

    // Default values for unset options
    assert.equal(templateData.withCredentials, true)
    assert.equal(templateData.hideDarkModeToggle, false)
    assert.equal(templateData.hideTestRequestButton, false)
    assert.equal(templateData.hideSearch, false)
    assert.equal(templateData.proxyUrl, '')
    assert.equal(templateData.persistAuth, false)
    assert.equal(templateData.theme, 'auto')
    assert.equal(templateData.layout, 'modern')
    assert.equal(templateData.showSidebar, true)
  })

  test('Edge case: undefined values are treated as unset', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

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
        proxyUrl: undefined,
        searchHotKey: undefined,
        configuration: undefined,
      },
      routes: {},
    }

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // Undefined values should fall back to defaults
    assert.equal(templateData.withCredentials, true)
    assert.equal(templateData.darkMode, false)
    assert.equal(templateData.proxyUrl, '')
    assert.equal(templateData.searchHotKey, 'k')
    assert.deepEqual(templateData.additionalConfig, {})
  })

  test('Edge case: withCredentials false is respected', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

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

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // Explicitly set to false should be respected
    assert.equal(templateData.withCredentials, false)
  })

  test('Edge case: showSidebar false is respected', async ({ assert }) => {
    const { OpenSwaggerService } = await import('../src/open_swagger_service.js')

    const mockApp = {
      container: {
        make: async () => ({}),
      },
    }

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

    const service = new OpenSwaggerService(config, mockApp as any)
    const templateData = service.getScalarTemplateData('/api/spec')

    // Explicitly set to false should be respected
    assert.equal(templateData.showSidebar, false)
  })
})
