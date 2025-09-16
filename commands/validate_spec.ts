import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Validate OpenAPI specification
 */
export default class ValidateSpec extends BaseCommand {
  static commandName = 'swagger:validate'
  static description = 'Validate the generated OpenAPI specification'

  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * Show detailed validation output
   */
  @flags.boolean({
    description: 'Show detailed validation output',
    default: false,
  })
  declare verbose: boolean

  /**
   * Execute the command
   */
  async run() {
    const { default: app } = await import('@adonisjs/core/services/app')

    try {
      // Get the Open Swagger service
      let openSwagger: any
      try {
        openSwagger = await app.container.make('open.swagger')
      } catch {
        this.logger.error(
          'Failed to resolve Open Swagger service. Make sure the provider is registered.'
        )
        return
      }

      if (!openSwagger.isEnabled()) {
        this.logger.warning('Open Swagger is disabled in configuration')
        return
      }

      this.logger.info('Validating OpenAPI specification...')

      // Generate and validate specification
      const spec = await openSwagger.generateSpec()

      // Basic validation
      const validationResults = this.validateSpec(spec)

      if (validationResults.isValid) {
        this.logger.success('✅ OpenAPI specification is valid!')

        if (this.verbose) {
          this.logger.info('')
          this.logger.info('Specification summary:')
          this.logger.info(`  Title: ${spec.info.title}`)
          this.logger.info(`  Version: ${spec.info.version}`)
          this.logger.info(`  Paths: ${Object.keys(spec.paths).length}`)
          this.logger.info(`  Operations: ${this.countOperations(spec)}`)

          if (spec.components?.schemas) {
            this.logger.info(`  Schemas: ${Object.keys(spec.components.schemas).length}`)
          }
        }
      } else {
        this.logger.error('❌ OpenAPI specification has validation errors:')
        validationResults.errors.forEach((error) => {
          this.logger.error(`  - ${error}`)
        })
        this.exitCode = 1
      }
    } catch (error) {
      this.logger.error('Failed to validate OpenAPI specification')
      this.logger.error(error.message)
      this.exitCode = 1
    }
  }

  /**
   * Validate OpenAPI specification
   */
  private validateSpec(spec: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check required fields
    if (!spec.openapi) {
      errors.push('Missing required field: openapi')
    }

    if (!spec.info) {
      errors.push('Missing required field: info')
    } else {
      if (!spec.info.title) {
        errors.push('Missing required field: info.title')
      }
      if (!spec.info.version) {
        errors.push('Missing required field: info.version')
      }
    }

    if (!spec.paths) {
      errors.push('Missing required field: paths')
    } else if (Object.keys(spec.paths).length === 0) {
      errors.push('No paths defined in specification')
    }

    // Validate paths
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      if (typeof pathItem !== 'object') {
        errors.push(`Invalid path item for ${path}`)
        continue
      }

      // Validate operations
      const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']
      for (const method of httpMethods) {
        const operation = (pathItem as any)[method]
        if (operation) {
          if (!operation.responses) {
            errors.push(`Missing responses for ${method.toUpperCase()} ${path}`)
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Count total operations in specification
   */
  private countOperations(spec: any): number {
    let count = 0
    const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']

    for (const pathItem of Object.values(spec.paths)) {
      for (const method of httpMethods) {
        if ((pathItem as any)[method]) {
          count++
        }
      }
    }

    return count
  }
}
