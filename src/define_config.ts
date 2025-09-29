import type { OpenSwaggerConfig } from './types.js'

/**
 * Define configuration for Open Swagger
 */
export function defineConfig(config: OpenSwaggerConfig): OpenSwaggerConfig {
  // Set default values
  const defaultConfig: Partial<OpenSwaggerConfig> = {
    enabled: true,
    path: '/docs',
    scalar: {
      theme: 'auto',
      layout: 'modern',
      showSidebar: true,
    },
    routes: {
      autoScan: true,
      exclude: ['/docs*', '/health*'],
    },
  }

  // Merge with provided config
  return {
    ...defaultConfig,
    ...config,
    scalar: {
      ...defaultConfig.scalar,
      ...config.scalar,
    },
    routes: {
      ...defaultConfig.routes,
      ...config.routes,
    },
    components: config.components
      ? {
          ...config.components,
        }
      : undefined,
  }
}
