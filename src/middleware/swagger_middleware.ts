import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Request } from '@adonisjs/core/http'
import type { OpenSwaggerConfig } from '../types.js'
import { timingSafeEqual } from 'node:crypto'

/**
 * Middleware for Swagger documentation routes
 * Handles CORS, security headers, and optional basic authentication
 */
export default class SwaggerMiddleware {
  constructor(private config: OpenSwaggerConfig) {}

  /**
   * Handle the request
   */
  async handle(ctx: HttpContext, next: NextFn) {
    // Check basic auth if enabled
    if (this.config.basicAuth?.enabled) {
      if (!this.validateBasicAuth(ctx.request)) {
        const realm = this.config.basicAuth.realm || 'API Documentation'
        ctx.response.header('WWW-Authenticate', `Basic realm="${realm}"`)
        ctx.response.status(401)
        return ctx.response.send('Unauthorized')
      }
    }

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

  /**
   * Validate basic authentication credentials
   * Uses timing-safe comparison to prevent timing attacks
   */
  private validateBasicAuth(request: Request): boolean {
    const authHeader = request.header('authorization')
    if (!authHeader?.startsWith('Basic ')) {
      return false
    }

    try {
      const base64Credentials = authHeader.slice(6)
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8')
      const colonIndex = credentials.indexOf(':')

      if (colonIndex === -1) {
        return false
      }

      const username = credentials.slice(0, colonIndex)
      const password = credentials.slice(colonIndex + 1)

      const expectedUsername = this.config.basicAuth!.username
      const expectedPassword = this.config.basicAuth!.password

      // Use timing-safe comparison to prevent timing attacks
      const usernameBuffer = Buffer.from(username)
      const expectedUsernameBuffer = Buffer.from(expectedUsername)
      const passwordBuffer = Buffer.from(password)
      const expectedPasswordBuffer = Buffer.from(expectedPassword)

      // Check lengths first, then do timing-safe comparison
      const usernameMatch =
        usernameBuffer.length === expectedUsernameBuffer.length &&
        timingSafeEqual(usernameBuffer, expectedUsernameBuffer)

      const passwordMatch =
        passwordBuffer.length === expectedPasswordBuffer.length &&
        timingSafeEqual(passwordBuffer, expectedPasswordBuffer)

      return usernameMatch && passwordMatch
    } catch {
      return false
    }
  }
}
