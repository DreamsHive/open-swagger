import { join, resolve, isAbsolute } from 'node:path'
import { existsSync, statSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import type { ApplicationService } from '@adonisjs/core/types'
import type { ComponentsConfig, SchemaValidator } from './types.js'
import { convertToJsonSchema } from './schema_utils.js'

/**
 * Parser for component schemas that generates OpenAPI component schemas
 * from schema definition files
 */
export class ComponentParser {
  constructor(
    private config: ComponentsConfig,
    private validator: SchemaValidator | undefined,
    private app: ApplicationService
  ) {}

  /**
   * Parse component schemas and return them as OpenAPI component schemas
   */
  async parseComponents(): Promise<Record<string, any>> {
    if (!this.config.include || this.config.include.length === 0) {
      return {}
    }

    try {
      const schemas: Record<string, any> = {}

      // Process each include path
      for (const includePath of this.config.include) {
        const resolvedPath = this.resolvePath(includePath)

        if (!existsSync(resolvedPath)) {
          // eslint-disable-next-line no-console
          console.warn(`Component schema path does not exist: ${resolvedPath}`)
          continue
        }

        const stat = statSync(resolvedPath)

        if (stat.isFile()) {
          // Single file
          const fileSchemas = await this.parseSchemaFile(resolvedPath)
          Object.assign(schemas, fileSchemas)
        } else if (stat.isDirectory()) {
          // Directory - scan for schema files
          const files = await this.scanDirectory(resolvedPath)
          for (const file of files) {
            const fileSchemas = await this.parseSchemaFile(file)
            Object.assign(schemas, fileSchemas)
          }
        }
      }

      return schemas
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn('Error parsing component schemas:', error.message)
      return {}
    }
  }

  /**
   * Resolve path relative to the application root
   */
  private resolvePath(path: string): string {
    if (isAbsolute(path)) {
      return path
    }

    // Get the application root directory
    let appRoot = this.app.appRoot.toString()

    // Handle file:// URLs from appRoot
    if (appRoot.startsWith('file://')) {
      appRoot = appRoot.replace('file://', '')
    }

    // Remove leading slash if present for relative path joining
    const cleanPath = path.startsWith('/') ? path.slice(1) : path

    return resolve(appRoot, cleanPath)
  }

  /**
   * Scan directory for schema files
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = []

    try {
      const entries = await readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name)

        if (entry.isFile() && this.isSchemaFile(entry.name)) {
          if (!this.isExcluded(fullPath)) {
            files.push(fullPath)
          }
        } else if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectory(fullPath)
          files.push(...subFiles)
        }
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn(`Error scanning directory ${dirPath}:`, error.message)
    }

    return files
  }

  /**
   * Check if a file is a schema file based on extension
   */
  private isSchemaFile(filename: string): boolean {
    return /\.(ts|js|mjs)$/.test(filename)
  }

  /**
   * Check if a file path should be excluded
   */
  private isExcluded(filePath: string): boolean {
    if (!this.config.exclude || this.config.exclude.length === 0) {
      return false
    }

    // Simple pattern matching - can be enhanced with glob patterns if needed
    return this.config.exclude.some((pattern) => {
      // Convert simple patterns to regex
      const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')

      return new RegExp(regexPattern).test(filePath)
    })
  }

  /**
   * Parse a single schema file and extract exported schemas
   */
  private async parseSchemaFile(filePath: string): Promise<Record<string, any>> {
    try {
      // Convert file path to a module path that can be imported
      const modulePath = this.filePathToModulePath(filePath)

      // Dynamic import of the schema file
      const module = await import(modulePath)

      const schemas: Record<string, any> = {}

      // Extract exported schemas
      for (const [exportName, exportValue] of Object.entries(module)) {
        if (this.isSchemaExport(exportName, exportValue)) {
          try {
            const jsonSchema = await convertToJsonSchema(exportValue, this.validator)
            if (jsonSchema) {
              schemas[exportName] = jsonSchema
            }
          } catch (error: any) {
            // eslint-disable-next-line no-console
            console.warn(`Error converting schema ${exportName} in ${filePath}:`, error.message)
          }
        }
      }

      return schemas
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.warn(`Error parsing schema file ${filePath}:`, error.message)
      return {}
    }
  }

  /**
   * Convert file path to module path for dynamic import
   */
  private filePathToModulePath(filePath: string): string {
    // For dynamic imports, we need to use file:// URLs on some systems
    // or relative paths from the current working directory
    if (process.platform === 'win32') {
      return `file:///${filePath.replace(/\\/g, '/')}`
    }
    return `file://${filePath}`
  }

  /**
   * Check if an export is likely a schema based on naming conventions and structure
   */
  private isSchemaExport(name: string, value: any): boolean {
    // Skip default exports and non-objects
    if (name === 'default' || typeof value !== 'object' || value === null) {
      return false
    }

    // Check naming conventions (ends with Schema, schema, etc.)
    if (/schema$/i.test(name)) {
      return true
    }

    // Check if it looks like a schema object structure
    if (this.looksLikeSchema(value)) {
      return true
    }

    return false
  }

  /**
   * Check if an object looks like a schema based on its structure
   */
  private looksLikeSchema(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) {
      return false
    }

    // Check for common schema patterns

    // VineJS schema pattern
    if (this.hasVineJSPattern(obj)) {
      return true
    }

    // Zod schema pattern
    if (obj._def && typeof obj._def === 'object') {
      return true
    }

    // TypeBox schema pattern
    if (obj[Symbol.toStringTag] === 'TypeBox') {
      return true
    }

    // JSON Schema pattern
    if (obj.type && typeof obj.type === 'string') {
      return true
    }

    return false
  }

  /**
   * Check if object has VineJS schema pattern
   */
  private hasVineJSPattern(obj: any): boolean {
    // VineJS schemas are typically objects with properties that have vine methods
    if (typeof obj !== 'object' || obj === null) {
      return false
    }

    // Check if any property looks like a VineJS field
    for (const value of Object.values(obj)) {
      if (this.isVineJSField(value)) {
        return true
      }
    }

    return false
  }

  /**
   * Check if a value looks like a VineJS field
   */
  private isVineJSField(value: any): boolean {
    if (typeof value !== 'object' || value === null) {
      return false
    }

    // VineJS fields typically have specific properties or methods
    // This is a heuristic check - may need refinement
    return (
      typeof value.clone === 'function' ||
      typeof value.optional === 'function' ||
      typeof value.nullable === 'function' ||
      (value.type && typeof value.type === 'string')
    )
  }
}
