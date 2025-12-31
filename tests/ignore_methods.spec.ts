import { test } from '@japa/runner'
import fc from 'fast-check'

/**
 * Property-based tests for ignoreMethods configuration
 * Feature: ignore-head-endpoints
 */

// Valid HTTP methods for testing
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT']

// Generator for HTTP methods with various casings
const httpMethodArb = fc.constantFrom(...HTTP_METHODS).chain((method) =>
  fc.constantFrom(
    method.toUpperCase(),
    method.toLowerCase(),
    method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
  )
)

// Generator for route info objects
const routeInfoArb = fc.record({
  method: httpMethodArb,
  pattern: fc.string({ minLength: 1 }).map((s) => `/${s.replace(/[^a-zA-Z0-9]/g, '')}`),
  handler: fc.constant('TestController.handle'),
  middleware: fc.constant([]),
  name: fc.option(fc.string(), { nil: undefined }),
})

// Generator for arrays of route info
const routeListArb = fc.array(routeInfoArb, { minLength: 1, maxLength: 20 })

// Generator for ignoreMethods arrays
const ignoreMethodsArb = fc.array(httpMethodArb, { minLength: 1, maxLength: 5 })

test.group('RouteParser - ignoreMethods Property Tests', () => {
  /**
   * Property 1: Ignored Methods Are Excluded
   * Feature: ignore-head-endpoints, Property 1: Ignored Methods Are Excluded
   * Validates: Requirements 1.1, 2.2
   *
   * For any route list and any non-empty ignoreMethods configuration array,
   * after filtering, no route in the result should have a method that appears
   * in the ignoreMethods array.
   */
  test('Property 1: Ignored methods are excluded from filtered routes', async ({ assert }) => {
    const { RouteParser } = await import('../src/route_parser.js')

    await fc.assert(
      fc.asyncProperty(routeListArb, ignoreMethodsArb, async (routes, ignoreMethods) => {
        const config = {
          enabled: true,
          path: '/docs',
          info: { title: 'Test API', version: '1.0.0' },
          scalar: {},
          routes: {
            autoScan: false,
            ignoreMethods: ignoreMethods,
          },
        }

        // Create mock router with the generated routes
        const mockRouter = {
          toJSON: () => ({
            root: routes.map((r) => ({
              pattern: r.pattern,
              method: r.method,
              handler: r.handler,
              middleware: r.middleware,
              name: r.name,
            })),
          }),
        }

        const mockApp = {
          container: {
            make: async (service: string) => {
              if (service === 'router') return mockRouter
              throw new Error(`Service ${service} not found`)
            },
          },
        }

        const parser = new RouteParser(config, mockApp as any)

        // Access the private filterRoutes method via the extractRoutes + filter flow
        // We need to test the filtering logic directly
        const extractedRoutes = (parser as any).extractRoutes(mockRouter)
        const filteredRoutes = (parser as any).filterRoutes(extractedRoutes)

        // Normalize ignoreMethods to uppercase for comparison
        const normalizedIgnoreMethods = ignoreMethods.map((m) => m.toUpperCase())

        // Property: No filtered route should have a method in ignoreMethods
        for (const route of filteredRoutes) {
          const routeMethodUpper = route.method.toUpperCase()
          assert.isFalse(
            normalizedIgnoreMethods.includes(routeMethodUpper),
            `Route with method ${route.method} should have been filtered out`
          )
        }
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2: No Filtering When ignoreMethods Is Undefined Or Empty
   * Feature: ignore-head-endpoints, Property 2: No Filtering When ignoreMethods Is Undefined Or Empty
   * Validates: Requirements 1.2, 1.3, 3.1
   *
   * For any route list, when ignoreMethods is undefined or an empty array,
   * all routes should pass through the method filter unchanged.
   */
  test('Property 2: No filtering when ignoreMethods is undefined or empty', async ({ assert }) => {
    const { RouteParser } = await import('../src/route_parser.js')

    // Test with undefined ignoreMethods
    await fc.assert(
      fc.asyncProperty(routeListArb, async (routes) => {
        const config = {
          enabled: true,
          path: '/docs',
          info: { title: 'Test API', version: '1.0.0' },
          scalar: {},
          routes: {
            autoScan: false,
            // ignoreMethods is undefined
          },
        }

        const mockRouter = {
          toJSON: () => ({
            root: routes.map((r) => ({
              pattern: r.pattern,
              method: r.method,
              handler: r.handler,
              middleware: r.middleware,
              name: r.name,
            })),
          }),
        }

        const mockApp = {
          container: {
            make: async (service: string) => {
              if (service === 'router') return mockRouter
              throw new Error(`Service ${service} not found`)
            },
          },
        }

        const parser = new RouteParser(config, mockApp as any)
        const extractedRoutes = (parser as any).extractRoutes(mockRouter)
        const filteredRoutes = (parser as any).filterRoutes(extractedRoutes)

        // Property: All routes should pass through (same count)
        assert.equal(
          filteredRoutes.length,
          extractedRoutes.length,
          'All routes should pass through when ignoreMethods is undefined'
        )
      }),
      { numRuns: 100 }
    )

    // Test with empty ignoreMethods array
    await fc.assert(
      fc.asyncProperty(routeListArb, async (routes) => {
        const config = {
          enabled: true,
          path: '/docs',
          info: { title: 'Test API', version: '1.0.0' },
          scalar: {},
          routes: {
            autoScan: false,
            ignoreMethods: [], // Empty array
          },
        }

        const mockRouter = {
          toJSON: () => ({
            root: routes.map((r) => ({
              pattern: r.pattern,
              method: r.method,
              handler: r.handler,
              middleware: r.middleware,
              name: r.name,
            })),
          }),
        }

        const mockApp = {
          container: {
            make: async (service: string) => {
              if (service === 'router') return mockRouter
              throw new Error(`Service ${service} not found`)
            },
          },
        }

        const parser = new RouteParser(config, mockApp as any)
        const extractedRoutes = (parser as any).extractRoutes(mockRouter)
        const filteredRoutes = (parser as any).filterRoutes(extractedRoutes)

        // Property: All routes should pass through (same count)
        assert.equal(
          filteredRoutes.length,
          extractedRoutes.length,
          'All routes should pass through when ignoreMethods is empty array'
        )
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Property 3: Case-Insensitive Method Matching
   * Feature: ignore-head-endpoints, Property 3: Case-Insensitive Method Matching
   * Validates: Requirements 2.3
   *
   * For any route with method M and any ignoreMethods array containing a string S
   * where M.toUpperCase() === S.toUpperCase(), the route should be excluded.
   */
  test('Property 3: Case-insensitive method matching', async ({ assert }) => {
    const { RouteParser } = await import('../src/route_parser.js')

    // Generator for method with random casing
    const methodWithCasingArb = fc.constantFrom(...HTTP_METHODS).chain((method) =>
      fc.tuple(
        // Route method casing
        fc.constantFrom(
          method.toUpperCase(),
          method.toLowerCase(),
          method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
        ),
        // ignoreMethods casing (different from route)
        fc.constantFrom(
          method.toUpperCase(),
          method.toLowerCase(),
          method.charAt(0).toLowerCase() + method.slice(1).toUpperCase()
        )
      )
    )

    await fc.assert(
      fc.asyncProperty(methodWithCasingArb, async ([routeMethod, ignoreMethod]) => {
        const config = {
          enabled: true,
          path: '/docs',
          info: { title: 'Test API', version: '1.0.0' },
          scalar: {},
          routes: {
            autoScan: false,
            ignoreMethods: [ignoreMethod],
          },
        }

        const routes = [
          {
            pattern: '/test',
            method: routeMethod,
            handler: 'TestController.handle',
            middleware: [],
          },
        ]

        const mockRouter = {
          toJSON: () => ({ root: routes }),
        }

        const mockApp = {
          container: {
            make: async (service: string) => {
              if (service === 'router') return mockRouter
              throw new Error(`Service ${service} not found`)
            },
          },
        }

        const parser = new RouteParser(config, mockApp as any)
        const extractedRoutes = (parser as any).extractRoutes(mockRouter)
        const filteredRoutes = (parser as any).filterRoutes(extractedRoutes)

        // Property: Route should be filtered out regardless of casing
        // since routeMethod and ignoreMethod are the same method with different casings
        assert.equal(
          filteredRoutes.length,
          0,
          `Route with method '${routeMethod}' should be filtered when ignoreMethods contains '${ignoreMethod}'`
        )
      }),
      { numRuns: 100 }
    )
  })
})
