import type { ApplicationService } from '@adonisjs/core/types'
import type { OpenSwaggerConfig, OpenAPISpec, RouteInfo, OpenAPIOperation } from './types.js'
import { getSwaggerMetadata } from './decorators.js'

/**
 * Parses AdonisJS routes and generates OpenAPI specification
 */
export class RouteParser {
  constructor(
    private config: OpenSwaggerConfig,
    private app: ApplicationService
  ) {}

  /**
   * Generate OpenAPI specification from routes
   */
  async generateSpec(): Promise<Partial<OpenAPISpec>> {
    try {
      let router: any
      try {
        router = await this.app.container.make('router')
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.warn('Could not resolve router service:', error.message)
        return { paths: {} }
      }

      const routes = this.extractRoutes(router)
      const filteredRoutes = this.filterRoutes(routes)

      const paths: Record<string, Record<string, OpenAPIOperation>> = {}

      for (const route of filteredRoutes) {
        try {
          const path = this.convertRoutePattern(route.pattern)
          const method = route.method.toLowerCase()

          const operation = await this.generateOperation(route)

          // Only add operation if it has decorator metadata
          if (operation) {
            if (!paths[path]) {
              paths[path] = {}
            }
            paths[path][method] = operation
          }
        } catch (routeError: any) {
          // Log individual route errors but continue processing other routes
          // eslint-disable-next-line no-console
          console.warn(`Error processing route ${route.pattern}:`, routeError.message)
          continue
        }
      }

      return { paths }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Error generating OpenAPI spec from routes:', error)
      return { paths: {} }
    }
  }

  /**
   * Extract routes from AdonisJS router
   */
  private extractRoutes(router: any): RouteInfo[] {
    const routes: RouteInfo[] = []

    try {
      // Get routes from router - AdonisJS v6 structure
      if (router.toJSON) {
        const routeData = router.toJSON()

        // Handle the new structure where routes are grouped by domain
        if (routeData && typeof routeData === 'object') {
          // Check if it's the new structure with domains
          if (routeData.root && Array.isArray(routeData.root)) {
            for (const route of routeData.root) {
              // Handle both single method and multiple methods
              const methods = Array.isArray(route.methods) ? route.methods : [route.method || 'GET']

              for (const method of methods) {
                const handlerInfo = this.extractHandlerInfo(route)
                routes.push({
                  method: method.toUpperCase(),
                  pattern: route.pattern || route.route,
                  handler: handlerInfo.handler,
                  middleware: this.extractMiddleware(route),
                  name: route.name,
                  domain: route.domain,
                  importFunction: handlerInfo.importFunction,
                  controllerClass: handlerInfo.controllerClass,
                  methodName: handlerInfo.methodName,
                })
              }
            }
          } else if (Array.isArray(routeData)) {
            // Handle old structure where routeData is directly an array
            for (const route of routeData) {
              // Handle both single method and multiple methods
              const methods = Array.isArray(route.methods) ? route.methods : [route.method || 'GET']

              for (const method of methods) {
                const handlerInfo = this.extractHandlerInfo(route)
                routes.push({
                  method: method.toUpperCase(),
                  pattern: route.pattern || route.route,
                  handler: handlerInfo.handler,
                  middleware: this.extractMiddleware(route),
                  name: route.name,
                  domain: route.domain,
                  importFunction: handlerInfo.importFunction,
                  controllerClass: handlerInfo.controllerClass,
                  methodName: handlerInfo.methodName,
                })
              }
            }
          }
        }
      } else {
        // Try alternative methods to get routes
        if (router.routes) {
          // Handle router.routes if available
        }

        if (router._routes) {
          // Handle router._routes if available
        }

        if (router.list) {
          if (typeof router.list === 'function') {
            router.list()
            // Handle route list if available
          }
        }
      }
    } catch {
      // Error extracting routes - continue silently
    }

    return routes
  }

  /**
   * Extract method name from AdonisJS reference string
   * e.g., '#controllers/users_controller.index' -> 'index'
   * e.g., '#controllers/users_controller' -> 'handle' (single action controller)
   */
  private extractMethodNameFromReference(reference: string): string {
    const parts = reference.split('.')
    if (parts.length > 1) {
      return parts[parts.length - 1]
    }
    return 'handle' // Single action controller
  }

  /**
   * Extract handler information from route
   */
  private extractHandler(route: any): string {
    if (route.handler) {
      // Handle string handlers like '#controllers/users_controller.index'
      if (typeof route.handler === 'string') {
        return route.handler
      }

      // Handle array handlers like [() => import('#controllers/auth_controller'), 'login']
      if (Array.isArray(route.handler) && route.handler.length === 2) {
        const [importFn, methodName] = route.handler
        if (typeof importFn === 'function' && typeof methodName === 'string') {
          return `Array[${importFn.name || 'ImportFunction'}, ${methodName}]`
        }
      }

      // Handle object handlers with lazy loading
      if (typeof route.handler === 'object' && route.handler.reference) {
        return route.handler.reference
      }

      // Handle function handlers
      if (typeof route.handler === 'function') {
        return route.handler.name || 'Anonymous'
      }

      return route.handler.name || 'Unknown'
    }
    if (route.action) {
      return typeof route.action === 'string' ? route.action : route.action.name || 'Unknown'
    }
    return 'Unknown'
  }

  /**
   * Extract complete handler information including import function and method name
   */
  private extractHandlerInfo(route: any): {
    handler: string
    importFunction?: () => Promise<any>
    controllerClass?: any
    methodName?: string
  } {
    if (route.handler) {
      // Handle array handlers like [() => import('#controllers/auth_controller'), 'login']
      // or [AuthController, 'login']
      if (Array.isArray(route.handler) && route.handler.length === 2) {
        const [firstElement, methodName] = route.handler
        if (typeof firstElement === 'function' && typeof methodName === 'string') {
          // Check if it's a class (constructor function) or an import function
          // Classes have a prototype, import functions don't
          if (firstElement.prototype && firstElement.prototype.constructor === firstElement) {
            // It's a direct class reference like [AuthController, 'login']
            return {
              handler: `Array[${firstElement.name || 'Controller'}, ${methodName}]`,
              controllerClass: firstElement,
              methodName: methodName,
            }
          } else {
            // It's an import function like [() => import('#controllers/auth_controller'), 'login']
            return {
              handler: `Array[${firstElement.name || 'ImportFunction'}, ${methodName}]`,
              importFunction: firstElement,
              methodName: methodName,
            }
          }
        }
      }

      // Handle object handlers for AdonisJS v6 lazy-loaded controllers
      // Structure: { reference: '#controllers/users_controller.index', name: '...', handle: Function }
      if (typeof route.handler === 'object' && route.handler.reference && route.handler.handle) {
        const reference = route.handler.reference

        // Reference is a string like '#controllers/users_controller.index'
        if (typeof reference === 'string') {
          return {
            handler: reference,
            methodName: this.extractMethodNameFromReference(reference),
          }
        }

        // Reference is an array like [importFunction] (single action controller)
        if (Array.isArray(reference) && reference.length > 0) {
          const [controllerModule] = reference
          return {
            handler: `Array[${controllerModule?.name || 'Controller'}, handle]`,
            importFunction: controllerModule,
            methodName: 'handle',
          }
        }
      }
    }

    // For all other handler types, use the existing extractHandler method
    return {
      handler: this.extractHandler(route),
    }
  }

  /**
   * Extract middleware from route
   */
  private extractMiddleware(route: any): string[] {
    const middleware: string[] = []

    if (route.middleware) {
      if (Array.isArray(route.middleware)) {
        middleware.push(
          ...route.middleware.map((m: any) => (typeof m === 'string' ? m : m.name || 'unknown'))
        )
      } else if (typeof route.middleware === 'string') {
        middleware.push(route.middleware)
      }
    }

    return middleware
  }

  /**
   * Filter routes based on configuration
   */
  private filterRoutes(routes: RouteInfo[]): RouteInfo[] {
    return routes.filter((route) => {
      // Skip if route matches exclude patterns
      if (this.config.routes?.exclude) {
        for (const pattern of this.config.routes.exclude) {
          if (this.matchesPattern(route.pattern, pattern)) {
            return false
          }
        }
      }

      // Include only if route matches include patterns (if specified)
      if (this.config.routes?.include) {
        for (const pattern of this.config.routes.include) {
          if (this.matchesPattern(route.pattern, pattern)) {
            return true
          }
        }
        return false
      }

      return true
    })
  }

  /**
   * Check if a route pattern matches a filter pattern
   */
  private matchesPattern(routePattern: string, filterPattern: string): boolean {
    // Simple pattern matching - can be enhanced with glob patterns
    if (filterPattern.includes('*')) {
      const regex = new RegExp(filterPattern.replace(/\*/g, '.*'))
      return regex.test(routePattern)
    }
    return routePattern.includes(filterPattern)
  }

  /**
   * Convert AdonisJS route pattern to OpenAPI path
   */
  private convertRoutePattern(pattern: string): string {
    // Convert :param to {param}
    return pattern.replace(/:([^/]+)/g, '{$1}')
  }

  /**
   * Generate OpenAPI operation for a route
   */
  private async generateOperation(route: RouteInfo): Promise<OpenAPIOperation | null> {
    // Try to get custom metadata from decorators
    const customMetadata = await this.getCustomMetadata(route)

    // If no custom metadata is found, return null to exclude this route from documentation
    if (!customMetadata) {
      return null
    }

    const operation: OpenAPIOperation = {
      summary: customMetadata.summary || '',
      description: customMetadata.description || '',
      operationId: this.generateOperationId(route),
      tags: customMetadata.tags || [],
      parameters: customMetadata.parameters || [],
      responses: customMetadata.responses || {},
    }

    // Add deprecated flag if specified
    if (customMetadata.deprecated) {
      operation.deprecated = true
    }

    // Add security if specified
    if (customMetadata.security) {
      operation.security = customMetadata.security
    }

    // Add request body if specified
    if (customMetadata.requestBody) {
      operation.requestBody = customMetadata.requestBody
    }

    return operation
  }

  /**
   * Get custom metadata from decorators
   */
  private async getCustomMetadata(route: RouteInfo): Promise<any> {
    try {
      // Handle array handlers with direct controller class reference first
      if (route.controllerClass && route.methodName) {
        try {
          const ControllerClass = route.controllerClass

          if (ControllerClass && ControllerClass.prototype) {
            const metadata = getSwaggerMetadata(ControllerClass.prototype, route.methodName)
            if (metadata) {
              return await this.resolveMetadataPromises(metadata)
            }
          }

          // If no metadata found but controller exists, return null (not an error)
          return null
        } catch {
          // Silently continue with fallback
          return null
        }
      }

      // Handle array handlers with import functions
      if (route.importFunction && route.methodName) {
        try {
          // Execute the import function to get the controller module
          const controllerModule = await route.importFunction()

          // Extract the controller class from the module
          const ControllerClass = controllerModule.default || controllerModule

          if (ControllerClass && ControllerClass.prototype) {
            const metadata = getSwaggerMetadata(ControllerClass.prototype, route.methodName)
            if (metadata) {
              return await this.resolveMetadataPromises(metadata)
            }
          }

          // If no metadata found but controller exists, return null (not an error)
          return null
        } catch {
          // Silently continue with fallback
          return null
        }
      }

      // Parse handler to get controller and method (for string handlers)
      const [controllerPath, methodName] = route.handler.split('.')

      if (!controllerPath || !methodName) {
        return null
      }

      // Try a direct approach: use the application's working directory to resolve the controller
      if (controllerPath.startsWith('#controllers/')) {
        try {
          // Get the application's working directory
          const appDir = process.cwd()

          // Convert #controllers/products_controller to ./app/controllers/products_controller.js
          const controllerName = controllerPath.replace('#controllers/', '')
          const possiblePaths = [
            `${appDir}/app/controllers/${controllerName}.js`,
            `${appDir}/app/controllers/${controllerName}.ts`,
            `file://${appDir}/app/controllers/${controllerName}.js`,
            `file://${appDir}/app/controllers/${controllerName}.ts`,
          ]

          for (const fullPath of possiblePaths) {
            try {
              const controllerModule = await import(fullPath)
              const ControllerClass = controllerModule.default || controllerModule

              if (ControllerClass && ControllerClass.prototype) {
                const metadata = getSwaggerMetadata(ControllerClass.prototype, methodName)
                if (metadata) {
                  return await this.resolveMetadataPromises(metadata)
                }
              }
            } catch {
              // Continue to next path
            }
          }
        } catch {
          // Continue to fallback approaches
        }
      }

      // Try using the application's container for AdonisJS import map paths
      if (controllerPath.startsWith('#')) {
        try {
          // Try different container resolution approaches
          const containerApproaches = [
            controllerPath,
            `${controllerPath}.default`,
            route.handler, // Try the full handler string
          ]

          for (const approach of containerApproaches) {
            try {
              const resolved: any = await this.app.container.make(approach)
              if (resolved) {
                // Handle different resolution results
                let ControllerClass: any = resolved
                if (resolved.default) {
                  ControllerClass = resolved.default
                }

                if (ControllerClass && ControllerClass.prototype) {
                  const metadata = getSwaggerMetadata(ControllerClass.prototype, methodName)
                  if (metadata) {
                    return await this.resolveMetadataPromises(metadata)
                  }
                }
              }
            } catch {
              // Continue to next approach
            }
          }

          // Try container resolution as fallback
          const ControllerClass: any = await this.app.container.make(controllerPath)
          if (ControllerClass && ControllerClass.prototype) {
            const metadata = getSwaggerMetadata(ControllerClass.prototype, methodName)
            if (metadata) {
              return await this.resolveMetadataPromises(metadata)
            }
          }
        } catch {
          // Fall back to direct import
        }
      }

      // Handle AdonisJS import map format: #controllers/users_controller
      let resolvedControllerPath = controllerPath
      if (controllerPath.startsWith('#controllers/')) {
        // Use the import map path directly - Node.js will resolve it
        resolvedControllerPath = controllerPath
      } else if (controllerPath.startsWith('#')) {
        // Handle other import map patterns
        resolvedControllerPath = controllerPath
      } else {
        // Fallback for non-import map paths
        resolvedControllerPath = `app/controllers/${controllerPath}`
      }

      // Try direct import as fallback
      const metadata = await this.tryDirectImport(resolvedControllerPath, methodName)

      return metadata
    } catch {
      return null
    }
  }

  /**
   * Try direct import with multiple path strategies
   */
  private async tryDirectImport(controllerPath: string, methodName: string): Promise<any> {
    let importPaths: string[] = []

    // Handle AdonisJS import map paths (e.g., #controllers/users_controller)
    if (controllerPath.startsWith('#')) {
      // For import map paths, try the path directly and with .js extension
      importPaths = [
        controllerPath,
        controllerPath.endsWith('.js') ? controllerPath : `${controllerPath}.js`,
      ]

      // Also try to resolve the import map manually
      if (controllerPath.startsWith('#controllers/')) {
        const controllerName = controllerPath.replace('#controllers/', '')
        // Try different possible paths relative to the application root
        const possiblePaths = [
          `./app/controllers/${controllerName}.js`,
          `./app/controllers/${controllerName}.ts`,
          `../app/controllers/${controllerName}.js`,
          `../app/controllers/${controllerName}.ts`,
          `../../app/controllers/${controllerName}.js`,
          `../../app/controllers/${controllerName}.ts`,
          `../../../app/controllers/${controllerName}.js`,
          `../../../app/controllers/${controllerName}.ts`,
          // Try from the examples directory structure
          `./examples/typebox-example/app/controllers/${controllerName}.js`,
          `./examples/typebox-example/app/controllers/${controllerName}.ts`,
          `../examples/typebox-example/app/controllers/${controllerName}.js`,
          `../examples/typebox-example/app/controllers/${controllerName}.ts`,
          `../../examples/typebox-example/app/controllers/${controllerName}.js`,
          `../../examples/typebox-example/app/controllers/${controllerName}.ts`,
        ]
        importPaths.push(...possiblePaths)
      }
    } else {
      // For regular paths, try multiple strategies
      importPaths = [
        controllerPath,
        `./${controllerPath}`,
        `../${controllerPath}`,
        `../../${controllerPath}`,
        `../../../${controllerPath}`,
        controllerPath.endsWith('.js') ? controllerPath : `${controllerPath}.js`,
        controllerPath.endsWith('.ts') ? controllerPath : `${controllerPath}.ts`,
        `./${controllerPath}.js`,
        `./${controllerPath}.ts`,
        `../${controllerPath}.js`,
        `../${controllerPath}.ts`,
        `../../${controllerPath}.js`,
        `../../${controllerPath}.ts`,
        `../../../${controllerPath}.js`,
        `../../../${controllerPath}.ts`,
      ]
    }

    for (const importPath of importPaths) {
      try {
        // Try to use the application's importer if available
        let controllerModule: any
        try {
          // First try using the application's container to resolve the controller
          if (this.app.container && typeof this.app.container.make === 'function') {
            try {
              // Try to resolve the controller through the container
              const resolvedController = await this.app.container.make(importPath)
              if (resolvedController) {
                controllerModule = { default: resolvedController }
              }
            } catch {
              // Fall back to direct import if container resolution fails
            }
          }
        } catch {
          // Ignore container errors and fall back to direct import
        }

        // If container resolution didn't work, try direct import
        if (!controllerModule) {
          // Try to use the application's importer if available
          if (
            (this.app as any).usingImporter &&
            typeof (this.app as any).usingImporter === 'function'
          ) {
            try {
              controllerModule = await (this.app as any).usingImporter(importPath)
            } catch {
              // Fall back to standard import
            }
          }

          // If no custom importer, use standard dynamic import
          if (!controllerModule) {
            controllerModule = await import(importPath)
          }
        }

        const ControllerClass = controllerModule.default || controllerModule

        if (!ControllerClass || !ControllerClass.prototype) {
          continue
        }

        const metadata = getSwaggerMetadata(ControllerClass.prototype, methodName)

        if (metadata) {
          return await this.resolveMetadataPromises(metadata)
        }

        // If no metadata found but controller exists, return null (not an error)
        return null
      } catch {
        // Continue to next import path
        continue
      }
    }

    // If all import attempts fail, return null silently
    return null
  }

  /**
   * Resolve any promises in metadata (from async schema conversion)
   */
  private async resolveMetadataPromises(metadata: any): Promise<any> {
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

  /**
   * Generate operation ID
   */
  private generateOperationId(route: RouteInfo): string {
    if (route.name) {
      return route.name.replace(/\./g, '_')
    }

    const method = route.method.toLowerCase()
    const path = route.pattern
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/[{}:]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    return `${method}_${path || 'root'}`
  }
}
