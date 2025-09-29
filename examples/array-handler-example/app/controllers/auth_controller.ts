import type { HttpContext } from '@adonisjs/core/http'
import { SwaggerInfo, SwaggerResponse, SwaggerRequestBody } from 'adonis-open-swagger'

export default class AuthController {
  @SwaggerInfo({
    tags: ['Authentication'],
    summary: 'User login',
    description: 'Authenticate user with email and password',
  })
  @SwaggerRequestBody('Login credentials', {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
    },
    required: ['email', 'password'],
  })
  @SwaggerResponse(200, 'Login successful', {
    type: 'object',
    properties: {
      token: { type: 'string' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  })
  @SwaggerResponse(401, 'Invalid credentials')
  async login({ request, response }: HttpContext) {
    // Implementation would go here
    return response.ok({
      token: 'example-jwt-token',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
      },
    })
  }

  @SwaggerInfo({
    tags: ['Authentication'],
    summary: 'User logout',
    description: 'Logout the authenticated user',
  })
  @SwaggerResponse(200, 'Logout successful')
  @SwaggerResponse(401, 'Unauthorized')
  async logout({ response }: HttpContext) {
    // Implementation would go here
    return response.ok({ message: 'Logged out successfully' })
  }

  @SwaggerInfo({
    tags: ['Authentication'],
    summary: 'User registration',
    description: 'Register a new user account',
  })
  @SwaggerRequestBody('User registration data', {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 2 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
    },
    required: ['name', 'email', 'password'],
  })
  @SwaggerResponse(201, 'User registered successfully', {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  })
  @SwaggerResponse(400, 'Validation error')
  @SwaggerResponse(409, 'Email already exists')
  async register({ request, response }: HttpContext) {
    // Implementation would go here
    return response.created({
      user: {
        id: 2,
        email: 'newuser@example.com',
        name: 'Jane Doe',
      },
    })
  }
}
