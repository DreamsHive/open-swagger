import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import {
  SwaggerInfo,
  SwaggerResponse,
  SwaggerRequestBody,
  SwaggerParam,
  SwaggerHeader,
} from 'open-swagger'

// Schemas
import {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserListSchema,
} from '../schemas/user.schema.js'

// Validators
import { validateCreateUser, validateUpdateUser } from '../validators/user.js'

export default class UsersController {
  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Get all users',
    description: 'Retrieve a paginated list of all users with VineJS validation',
  })
  @SwaggerParam(
    {
      name: 'page',
      location: 'query',
      description: 'Page number for pagination',
    },
    vine.number().min(1).optional()
  )
  @SwaggerParam(
    {
      name: 'limit',
      location: 'query',
      description: 'Number of items per page',
    },
    vine.number().min(1).max(100).optional()
  )
  @SwaggerHeader(
    {
      name: 'X-API-Version',
      description: 'API version header',
    },
    vine.string().optional()
  )
  @SwaggerResponse(200, 'Users retrieved successfully', UserListSchema)
  @SwaggerResponse(400, 'Invalid query parameters')
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    // Mock data for demonstration
    const users = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    return response.json({
      data: users,
      meta: {
        total: users.length,
        page,
        perPage: limit,
        lastPage: Math.ceil(users.length / limit),
      },
    })
  }

  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID using VineJS validation',
  })
  @SwaggerParam(
    {
      name: 'id',
      location: 'path',
      description: 'User ID',
    },
    vine.number().positive(),
    true
  )
  @SwaggerResponse(200, 'User found', UserSchema)
  @SwaggerResponse(404, 'User not found')
  async show({ params, response }: HttpContext) {
    const userId = params.id

    // Mock user data
    const user = {
      id: Number.parseInt(userId),
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return response.json(user)
  }

  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Create new user',
    description: 'Create a new user with VineJS schema validation',
  })
  @SwaggerRequestBody('User data', CreateUserSchema)
  @SwaggerResponse(201, 'User created successfully', UserSchema)
  @SwaggerResponse(400, 'Validation error')
  @SwaggerResponse(422, 'Invalid input data')
  async store({ request, response }: HttpContext) {
    // Validate request data using VineJS
    const data = await request.validateUsing(validateCreateUser)

    // Mock user creation
    const user = {
      id: Math.floor(Math.random() * 1000) + 1,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return response.status(201).json(user)
  }

  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Update user',
    description: 'Update an existing user with VineJS validation',
  })
  @SwaggerParam(
    {
      name: 'id',
      location: 'path',
      description: 'User ID',
    },
    vine.number().positive(),
    true
  )
  @SwaggerRequestBody('User update data', UpdateUserSchema)
  @SwaggerResponse(200, 'User updated successfully', UserSchema)
  @SwaggerResponse(404, 'User not found')
  @SwaggerResponse(400, 'Validation error')
  async update({ params, request, response }: HttpContext) {
    const userId = params.id

    // Validate request data using VineJS
    const data = await request.validateUsing(validateUpdateUser)

    // Mock user update
    const user = {
      id: Number.parseInt(userId),
      name: data.name || 'John Doe',
      email: data.email || 'john@example.com',
      age: data.age || 30,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date(),
    }

    return response.json(user)
  }

  @SwaggerInfo({
    tags: ['Users'],
    summary: 'Delete user',
    description: 'Delete a user by ID',
  })
  @SwaggerParam(
    {
      name: 'id',
      location: 'path',
      description: 'User ID',
    },
    vine.number().positive(),
    true
  )
  @SwaggerResponse(204, 'User deleted successfully')
  @SwaggerResponse(404, 'User not found')
  async destroy({ params, response }: HttpContext) {
    const userId = params.id

    // Mock user deletion
    return response.status(204).send('')
  }
}
