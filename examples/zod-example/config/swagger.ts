import { defineConfig } from 'adonis-open-swagger'

export default defineConfig({
  enabled: true,
  path: '/docs',
  validator: 'zod',
  info: {
    title: 'Blog API with Zod Validation',
    version: '1.0.0',
    description: `# Blog API Documentation`,
    contact: {
      name: 'API Support Team',
      email: 'support@example.com',
      url: 'https://example.com/support',
    },
    license: {
      name: 'MIT License',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3333',
      description: 'Development server',
    },
    {
      url: 'https://api.example.com',
      description: 'Production server',
    },
    {
      url: 'https://staging-api.example.com',
      description: 'Staging server',
    },
  ],
  tags: [
    {
      name: 'Posts',
      description: 'Blog post management operations',
    },
    {
      name: 'Authors',
      description: 'Author management and profiles',
    },
    {
      name: 'Categories',
      description: 'Post categorization and tagging',
    },
  ],
  routes: {
    include: ['/api/*'],
    exclude: ['/api/internal/*', '/api/admin/*'],
  },
  scalar: {
    theme: 'elysiajs',
  },
})
