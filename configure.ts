import 'reflect-metadata'
import { getDirname } from '@adonisjs/core/helpers'
import type Configure from '@adonisjs/core/commands/configure'

// Get the stubs directory path
const stubsRoot = getDirname(import.meta.url) + '/stubs'

/**
 * Configure command for Open Swagger package
 */
export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  // Register the service provider
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('adonis-open-swagger/providers/open_swagger_provider')
  })

  // Create the configuration file
  await codemods.makeUsingStub(stubsRoot, 'config/swagger.stub', {
    title: command.app.appName || 'API Documentation',
    version: '1.0.0',
    description: `API documentation for ${command.app.appName || 'your application'}`,
  })

  // Create example route file if it doesn't exist
  await codemods.makeUsingStub(stubsRoot, 'start/swagger_routes.stub', {})

  // Add commands to adonisrc.ts
  await codemods.updateRcFile((rcFile: any) => {
    rcFile.addCommand('adonis-open-swagger/commands')
  })

  // Display success message
  command.logger.success('Open Swagger configured successfully!')
  command.logger.info('')
  command.logger.info('Next steps:')
  command.logger.info('1. Update config/swagger.ts with your API information')
  command.logger.info('2. Start your server and visit /docs to see your API documentation')
  command.logger.info('3. Use decorators or comments to add custom documentation')
  command.logger.info('')
  command.logger.info('Documentation: https://github.com/devoresyah/adonis-open-swagger')
}
