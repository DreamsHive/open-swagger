/**
 * Adonis Open Swagger Commands
 */

import GenerateDocs from './generate_docs.js'
import ValidateSpec from './validate_spec.js'

// Types
import type { CommandMetaData } from '@adonisjs/core/types/ace'
import type { BaseCommand } from '@adonisjs/core/ace'

/**
 * Returns an array of command metadata
 */
export async function getMetaData(): Promise<CommandMetaData[]> {
  return [
    {
      commandName: GenerateDocs.commandName,
      description: GenerateDocs.description,
      namespace: null,
      aliases: GenerateDocs.aliases || [],
      flags: [],
      args: [],
      options: GenerateDocs.options || {},
    },
    {
      commandName: ValidateSpec.commandName,
      description: ValidateSpec.description,
      namespace: null,
      aliases: ValidateSpec.aliases || [],
      flags: [],
      args: [],
      options: ValidateSpec.options || {},
    },
  ]
}

/**
 * Returns the command class for the given metadata
 */
export async function getCommand(metaData: CommandMetaData): Promise<typeof BaseCommand | null> {
  if (metaData.commandName === GenerateDocs.commandName) {
    return GenerateDocs
  }
  if (metaData.commandName === ValidateSpec.commandName) {
    return ValidateSpec
  }
  return null
}
