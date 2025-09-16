import app from '@adonisjs/core/services/app'
import { OpenSwaggerService } from '../src/open_swagger_service.js'
import type { OpenSwaggerConfig } from '../src/types.js'

/**
 * Main OpenSwagger service instance
 * This can be imported and used to register routes manually
 */
let openSwaggerService: OpenSwaggerService | null = null

/**
 * Get or create the OpenSwagger service instance
 */
function getOpenSwaggerService(): OpenSwaggerService {
  if (!openSwaggerService) {
    const config = app.config.get('swagger', {}) as OpenSwaggerConfig
    openSwaggerService = new OpenSwaggerService(config, app)
  }
  return openSwaggerService
}

/**
 * Register OpenAPI documentation routes
 * This should be called manually in start/routes.ts
 *
 * @param path - Base path for the documentation (default: '/docs')
 * @returns Router group for further customization
 */
async function registerRoutes(path: string = '/docs') {
  const router = await app.container.make('router')
  const service = getOpenSwaggerService()

  const group = router.group(() => {
    // Documentation UI endpoint using Edge template
    router.get(path, async ({ response, view }: any) => {
      const specUrl = `${path}/json`

      response.header('Content-Type', 'text/html')
      response.header('Cache-Control', 'no-cache')

      // Render using Edge template
      const templateData = service.getScalarTemplateData(specUrl)
      return view.render('adonis-open-swagger::scalar', templateData)
    })

    // JSON endpoint
    router.get(`${path}/json`, async ({ response }: any) => {
      const spec = await service.getSpecJson()
      response.header('Content-Type', 'application/json')
      response.header('Cache-Control', 'no-cache')
      return spec
    })

    // YAML endpoint
    router.get(`${path}/yaml`, async ({ response }: any) => {
      const spec = await service.getSpecYaml()
      response.header('Content-Type', 'application/yaml')
      response.header('Cache-Control', 'no-cache')
      return spec
    })
  })

  return group
}

/**
 * Generate OpenAPI specification
 */
async function generateSpec() {
  const service = getOpenSwaggerService()
  return service.generateSpec()
}

/**
 * Check if OpenSwagger is enabled
 */
function isEnabled(): boolean {
  const service = getOpenSwaggerService()
  return service.isEnabled()
}

export default {
  registerRoutes,
  generateSpec,
  isEnabled,
}
