import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware for Swagger documentation routes
 */
export default class SwaggerMiddleware {
  /**
   * Handle the request
   */
  async handle(ctx: HttpContext, next: NextFn) {
    // Add CORS headers for API documentation
    ctx.response.header('Access-Control-Allow-Origin', '*')
    ctx.response.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
    ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // Add security headers
    ctx.response.header('X-Content-Type-Options', 'nosniff')
    ctx.response.header('X-Frame-Options', 'DENY')
    ctx.response.header('X-XSS-Protection', '1; mode=block')

    // Handle preflight requests
    if (ctx.request.method() === 'OPTIONS') {
      ctx.response.status(204)
      return
    }

    await next()
  }
}
