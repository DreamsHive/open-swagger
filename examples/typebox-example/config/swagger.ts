import { defineConfig } from 'open-swagger'

/**
 * Configuration for Open Swagger - TypeBox Example
 */
export default defineConfig({
  enabled: true,
  path: '/docs',
  validator: 'typebox',
  info: {
    title: 'TypeBox Example API',
    version: '1.0.0',
    description:
      'A comprehensive example API showcasing TypeBox schema validation with Open Swagger documentation',
  },
  /**
   * Scalar UI configuration
   */
  scalar: {
    /**
     * Theme: 'light', 'dark', or 'auto'
     */
    theme: 'elysiajs',

    /**
     * Layout: 'modern' or 'classic'
     */
    layout: 'modern',

    /**
     * Show sidebar
     */
    showSidebar: true,

    /**
     * Custom CSS for additional styling
     */
    // customCss: `
    //   /* VineJS Example Custom Styles */
    //   .scalar-api-reference {
    //     --scalar-color-1: #10b981;
    //     --scalar-color-accent: #10b981;
    //   }
    // `,

    /**
     * Additional Scalar configuration
     */
    configuration: {
      // Add any additional Scalar options here
    },
  },

  /**
   * Route scanning options
   */
  routes: {
    /**
     * Automatically scan for routes
     */
    autoScan: true,

    /**
     * Include routes matching these patterns
     */
    include: [
      '/api/v1/*',
      // Add more patterns as needed
    ],

    /**
     * Exclude routes matching these patterns
     */
    exclude: [
      '/docs*',
      '/health*',
      // Add more patterns as needed
    ],
  },
})
