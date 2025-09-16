import { test } from '@japa/runner'

test.group('Configure command', () => {
  test('should export configure function', async ({ assert }) => {
    const { configure } = await import('../configure.js')
    assert.isFunction(configure)
  })

  test('should export defineConfig function', async ({ assert }) => {
    const { defineConfig } = await import('../index.js')
    assert.isFunction(defineConfig)
  })
})
