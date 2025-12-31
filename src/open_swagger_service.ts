import type { ApplicationService } from '@adonisjs/core/types'
import type { OpenSwaggerConfig, OpenAPISpec } from './types.js'
import { RouteParser } from './route_parser.js'
import { ComponentParser } from './component_parser.js'
import { setGlobalValidator } from './decorators.js'

/**
 * Main service class for Open Swagger
 */
export class OpenSwaggerService {
  private routeParser: RouteParser
  private componentParser: ComponentParser | null = null

  constructor(
    private config: OpenSwaggerConfig,
    // @ts-ignore - Used by RouteParser
    private app: ApplicationService
  ) {
    this.routeParser = new RouteParser(config, app)

    // Initialize component parser if components are configured
    if (this.config.components) {
      this.componentParser = new ComponentParser(this.config.components, this.config.validator, app)
    }

    // Set the global validator configuration
    setGlobalValidator(config.validator)
  }

  /**
   * Check if swagger is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled !== false
  }

  /**
   * Get the documentation path
   */
  getPath(): string {
    return this.config.path || '/docs'
  }

  /**
   * Generate OpenAPI specification
   */
  async generateSpec(): Promise<OpenAPISpec> {
    let spec: OpenAPISpec = {
      openapi: '3.0.3',
      info: this.config.info,
      paths: {},
    }

    // Add servers if configured
    if (this.config.servers) {
      spec.servers = this.config.servers
    }

    // Add security schemes if configured
    if (this.config.securitySchemes) {
      spec.components = {
        ...spec.components,
        securitySchemes: this.config.securitySchemes,
      }
    }

    // Add global security if configured
    if (this.config.security) {
      spec.security = this.config.security
    }

    // Add tags if configured
    if (this.config.tags) {
      spec.tags = this.config.tags
    }

    // Add component schemas if configured
    if (this.componentParser) {
      try {
        const componentSchemas = await this.componentParser.parseComponents()
        if (Object.keys(componentSchemas).length > 0) {
          spec.components = {
            ...spec.components,
            schemas: {
              ...spec.components?.schemas,
              ...componentSchemas,
            },
          }
        }
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.warn('Error generating component schemas:', error.message)
        // Continue without component schemas if parsing fails
      }
    }

    // Auto-generate from routes if enabled
    if (this.config.routes?.autoScan !== false) {
      try {
        const autoSpec = await this.routeParser.generateSpec()
        spec = this.mergeSpecs(spec, autoSpec)
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.warn('Error generating spec from routes:', error.message)
        // Continue with empty paths if route parsing fails
      }
    }

    // Merge custom specification if provided
    if (this.config.customSpec) {
      spec = this.mergeSpecs(spec, this.config.customSpec)
    }

    return spec
  }

  /**
   * Get OpenAPI specification as JSON string
   */
  async getSpecJson(): Promise<string> {
    const spec = await this.generateSpec()
    return JSON.stringify(spec, null, 2)
  }

  /**
   * Get OpenAPI specification as YAML string
   */
  async getSpecYaml(): Promise<string> {
    const { stringify } = await import('yaml')
    const spec = await this.generateSpec()
    return stringify(spec)
  }

  /**
   * Get template data for Scalar UI Edge rendering
   */
  getScalarTemplateData(specUrl: string): any {
    const scalar = this.config.scalar || {}

    return {
      // Existing options
      title: this.config.info.title,
      description: this.config.info.description,
      specUrl,
      theme: scalar.theme || 'auto',
      layout: scalar.layout || 'modern',
      showSidebar: scalar.showSidebar !== false,
      customCss: scalar.customCss || '',

      // New options with defaults
      withCredentials: scalar.withCredentials !== false, // default true
      darkMode: scalar.darkMode || false,
      hideDarkModeToggle: scalar.hideDarkModeToggle || false,
      hideTestRequestButton: scalar.hideTestRequestButton || false,
      hideModels: scalar.hideModels || false,
      hideSearch: scalar.hideSearch || false,
      searchHotKey: scalar.searchHotKey || 'k',
      proxyUrl: scalar.proxyUrl || '',
      persistAuth: scalar.persistAuth || false,

      // Pass through additional configuration
      additionalConfig: scalar.configuration || {},
    }
  }

  /**
   * Merge two OpenAPI specifications
   */
  private mergeSpecs(base: any, override: any): any {
    const merged = { ...base }

    // Merge paths
    if (override.paths) {
      merged.paths = { ...merged.paths, ...override.paths }
    }

    // Merge components
    if (override.components) {
      merged.components = {
        ...merged.components,
        schemas: {
          ...merged.components?.schemas,
          ...override.components.schemas,
        },
        securitySchemes: {
          ...merged.components?.securitySchemes,
          ...override.components.securitySchemes,
        },
      }
    }

    // Merge other properties
    Object.keys(override).forEach((key) => {
      if (key !== 'paths' && key !== 'components') {
        merged[key] = override[key]
      }
    })

    return merged
  }
}
