import { test } from '@japa/runner'
import { join } from 'node:path'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'

test.group('Import Alias Resolution', () => {
  function setupTestEnvironment() {
    const testDir = join(process.cwd(), 'test-alias-' + Date.now())
    mkdirSync(join(testDir, 'app', 'schemas'), { recursive: true })

    // Create package.json with imports
    const packageJson = {
      name: 'test-app',
      imports: {
        '#schemas/*': './app/schemas/*.js',
        '#schemas/index.schema': './app/schemas/index.schema.js',
      },
    }
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2))

    return { testDir }
  }

  function cleanupTestEnvironment(testDir: string) {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  }

  test('should resolve exact import alias paths correctly', async ({ assert }) => {
    const { testDir } = setupTestEnvironment()

    try {
      const { ComponentParser } = await import('../src/component_parser.js')

      // Create a test file
      writeFileSync(
        join(testDir, 'app', 'schemas', 'index.schema.js'),
        `export const testSchema = { type: 'object' }`
      )

      const config = {
        include: ['#schemas/index.schema'],
      }

      const mockApp = {
        appRoot: {
          toString: () => testDir,
        },
      }

      const parser = new ComponentParser(config, undefined, mockApp as any)

      // Test the resolvePath method directly by accessing it through reflection
      const resolvePath = (parser as any).resolvePath.bind(parser)
      const resolvedPath = resolvePath('#schemas/index.schema')

      const expectedPath = join(testDir, 'app', 'schemas', 'index.schema.js')
      assert.equal(resolvedPath, expectedPath)
      assert.isTrue(existsSync(resolvedPath))
    } finally {
      cleanupTestEnvironment(testDir)
    }
  })

  test('should resolve import alias from package.json correctly', async ({ assert }) => {
    const { testDir } = setupTestEnvironment()

    try {
      const { ComponentParser } = await import('../src/component_parser.js')

      const config = {
        include: ['#schemas/index.schema'],
      }

      const mockApp = {
        appRoot: {
          toString: () => testDir,
        },
      }

      const parser = new ComponentParser(config, undefined, mockApp as any)

      // Test the resolveImportAlias method directly
      const resolveImportAlias = (parser as any).resolveImportAlias.bind(parser)
      const resolvedPath = resolveImportAlias('#schemas/index.schema')

      const expectedPath = join(testDir, 'app', 'schemas', 'index.schema.js')
      assert.equal(resolvedPath, expectedPath)
    } finally {
      cleanupTestEnvironment(testDir)
    }
  })

  test('should handle non-existent import aliases gracefully', async ({ assert }) => {
    const { testDir } = setupTestEnvironment()

    try {
      const { ComponentParser } = await import('../src/component_parser.js')

      const config = {
        include: ['#nonexistent/path'],
      }

      const mockApp = {
        appRoot: {
          toString: () => testDir,
        },
      }

      const parser = new ComponentParser(config, undefined, mockApp as any)

      // Test the resolveImportAlias method directly
      const resolveImportAlias = (parser as any).resolveImportAlias.bind(parser)
      const resolvedPath = resolveImportAlias('#nonexistent/path')

      assert.isNull(resolvedPath)
    } finally {
      cleanupTestEnvironment(testDir)
    }
  })

  test('should work without package.json imports field', async ({ assert }) => {
    const testDir = join(process.cwd(), 'test-no-imports-' + Date.now())
    mkdirSync(testDir, { recursive: true })

    // Create package.json without imports
    const packageJson = {
      name: 'test-app-no-imports',
    }
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2))

    try {
      const { ComponentParser } = await import('../src/component_parser.js')

      const config = {
        include: ['#schemas/index.schema'],
      }

      const mockApp = {
        appRoot: {
          toString: () => testDir,
        },
      }

      const parser = new ComponentParser(config, undefined, mockApp as any)

      // Test the resolveImportAlias method directly
      const resolveImportAlias = (parser as any).resolveImportAlias.bind(parser)
      const resolvedPath = resolveImportAlias('#schemas/index.schema')

      assert.isNull(resolvedPath)
    } finally {
      cleanupTestEnvironment(testDir)
    }
  })
})
