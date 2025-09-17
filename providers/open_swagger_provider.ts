import 'reflect-metadata'
import type { ApplicationService } from '@adonisjs/core/types'
import { OpenSwaggerService } from '../src/open_swagger_service.js'
import type { OpenSwaggerConfig } from '../src/types.js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'open.swagger': OpenSwaggerService
  }
}

/**
 * Open Swagger service provider
 */
export default class OpenSwaggerProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton('open.swagger', async () => {
      try {
        const config = this.app.config.get('swagger', {}) as OpenSwaggerConfig
        return new OpenSwaggerService(config, this.app)
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Error creating OpenSwaggerService:', error)
        throw error
      }
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    // Mount Edge templates first
    await this.mountEdgeTemplates()

    // Register routes immediately in boot
    await this.registerRoutes()
  }

  /**
   * Mount Edge templates using direct Edge.js import
   */
  private async mountEdgeTemplates() {
    try {
      // Import Edge.js directly
      const { default: edge } = await import('edge.js')
      const templatesPath = join(dirname(fileURLToPath(import.meta.url)), '../templates')

      if (edge && typeof edge.mount === 'function') {
        edge.mount('adonis-open-swagger', templatesPath)
      }
    } catch {
      // Silently fail if Edge templates cannot be mounted
    }
  }

  /**
   * Register routes
   */
  private async registerRoutes() {
    // Automatically register OpenAPI documentation routes
    try {
      const config = this.app.config.get('swagger', {}) as OpenSwaggerConfig
      // Only register routes if the service is enabled
      if (config.enabled !== false) {
        const router = await this.app.container.make('router')
        const service = await this.app.container.make('open.swagger')

        const docsPath = config.path || '/docs'

        // Register the documentation routes automatically
        router.group(() => {
          // Documentation UI endpoint
          router.get(docsPath, async ({ response }: any) => {
            const specUrl = `${docsPath}/json`

            response.header('Content-Type', 'text/html')
            response.header('Cache-Control', 'no-cache')

            // Render using Edge.js directly
            const templateData = service.getScalarTemplateData(specUrl)

            // Use Edge.js directly for rendering
            const { default: edge } = await import('edge.js')
            const rendered = await edge.render('adonis-open-swagger::scalar', templateData)

            return rendered
          })

          // JSON endpoint
          router.get(`${docsPath}/json`, async ({ response }: any) => {
            const spec = await service.getSpecJson()
            response.header('Content-Type', 'application/json')
            response.header('Cache-Control', 'no-cache')
            return spec
          })

          // YAML endpoint
          router.get(`${docsPath}/yaml`, async ({ response }: any) => {
            const spec = await service.getSpecYaml()
            response.header('Content-Type', 'application/yaml')
            response.header('Cache-Control', 'no-cache')
            return spec
          })
        })
      }
    } catch {
      // Silently fail if there are issues - this ensures the app can still start
      // even if OpenSwagger has configuration issues
    }
  }

  /**
   * The application has been booted
   */
  async start() {
    // Minimal start
  }

  /**
   * The process has been started
   */
  async ready() {
    // Minimal ready
  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    // Minimal shutdown
  }
}
