import { defineConfig } from 'open-swagger'

/**
 * Configuration for Open Swagger - VineJS Example
 */
export default defineConfig({
  /**
   * Enable or disable swagger documentation
   */
  enabled: true,

  /**
   * Path where the documentation will be served
   */
  path: '/docs',

  /**
   * Schema validator to use for schema conversion
   */
  validator: 'vinejs',

  /**
   * OpenAPI specification information
   */
  info: {
    title: 'VineJS Example API',
    version: '1.0.0',
    description: 'API documentation demonstrating VineJS schema validation with Open Swagger',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },

  /**
   * Servers configuration
   */
  servers: [
    {
      url: 'http://localhost:3333',
      description: 'Development server',
    },
  ],

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

  /**
   * Global tags for organizing endpoints
   */
  tags: [
    {
      name: 'Users',
      description: 'User management operations using VineJS validation',
    },
    {
      name: 'Posts',
      description: 'Post management operations with VineJS schemas',
    },
  ],
})
