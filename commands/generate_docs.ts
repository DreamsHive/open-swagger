import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Generate OpenAPI documentation files
 */
export default class GenerateDocs extends BaseCommand {
  static commandName = 'swagger:generate'
  static description = 'Generate OpenAPI specification files'

  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * Output format flag
   */
  @flags.string({
    description: 'Output format (json, yaml, or both)',
    default: 'both',
  })
  declare format: 'json' | 'yaml' | 'both'

  /**
   * Output directory flag
   */
  @flags.string({
    description: 'Output directory for generated files',
    default: './docs',
  })
  declare output: string

  /**
   * Execute the command
   */
  async run() {
    const { default: app } = await import('@adonisjs/core/services/app')

    try {
      // Get the Adonis Open Swagger service
      let openSwagger: any
      try {
        openSwagger = await app.container.make('open.swagger')
      } catch {
        this.logger.error(
          'Failed to resolve Adonis Open Swagger service. Make sure the provider is registered.'
        )
        return
      }

      if (!openSwagger.isEnabled()) {
        this.logger.warning('Adonis Open Swagger is disabled in configuration')
        return
      }

      this.logger.info('Generating OpenAPI specification...')

      // Generate specifications
      if (this.format === 'json' || this.format === 'both') {
        const jsonSpec = await openSwagger.getSpecJson()
        const jsonPath = join(this.output, 'openapi.json')
        await writeFile(jsonPath, jsonSpec)
        this.logger.success(`Generated: ${jsonPath}`)
      }

      if (this.format === 'yaml' || this.format === 'both') {
        const yamlSpec = await openSwagger.getSpecYaml()
        const yamlPath = join(this.output, 'openapi.yaml')
        await writeFile(yamlPath, yamlSpec)
        this.logger.success(`Generated: ${yamlPath}`)
      }

      this.logger.info('')
      this.logger.success('OpenAPI specification generated successfully!')
    } catch (error) {
      this.logger.error('Failed to generate OpenAPI specification')
      this.logger.error(error.message)
      this.exitCode = 1
    }
  }
}
