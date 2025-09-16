import type { HttpContext } from '@adonisjs/core/http'
import { z } from 'zod'
import { SwaggerInfo, SwaggerResponse, SwaggerRequestBody, SwaggerParam } from 'open-swagger'

// Zod schemas for validation and documentation
const PostSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(5).max(200),
  content: z.string().min(20).max(5000),
  excerpt: z.string().min(10).max(300).optional(),
  authorId: z.number().int().positive(),
  published: z.boolean(),
  publishedAt: z.string().datetime().nullable(),
  tags: z.array(z.string()),
  metadata: z.object({
    views: z.number().int().min(0),
    likes: z.number().int().min(0),
    shares: z.number().int().min(0),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const CreatePostSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(20).max(5000),
  excerpt: z.string().min(10).max(300).optional(),
  authorId: z.number().int().positive(),
  published: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})

const UpdatePostSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(20).max(5000).optional(),
  excerpt: z.string().min(10).max(300).optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

const PostListSchema = z.object({
  data: z.array(PostSchema),
  meta: z.object({
    total: z.number().int(),
    page: z.number().int(),
    perPage: z.number().int(),
    lastPage: z.number().int(),
  }),
})

const ErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
})

export default class PostsController {
  @SwaggerInfo({
    tags: ['Posts'],
    summary: 'Get all posts',
    description: 'Retrieve a paginated list of all blog posts with Zod validation',
  })
  @SwaggerParam(
    {
      name: 'page',
      location: 'query',
      description: 'Page number for pagination',
    },
    z.number().int().min(1).optional()
  )
  @SwaggerParam(
    {
      name: 'limit',
      location: 'query',
      description: 'Number of items per page',
    },
    z.number().int().min(1).max(50).optional()
  )
  @SwaggerParam(
    {
      name: 'published',
      location: 'query',
      description: 'Filter by published status',
    },
    z.boolean().optional()
  )
  @SwaggerParam(
    {
      name: 'author',
      location: 'query',
      description: 'Filter by author ID',
    },
    z.number().int().positive().optional()
  )
  @SwaggerResponse(200, 'Posts retrieved successfully', PostListSchema)
  @SwaggerResponse(400, 'Invalid query parameters', ErrorSchema)
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const published = request.input('published')
    const author = request.input('author')

    // Mock data for demonstration
    const posts = [
      {
        id: 1,
        title: 'Getting Started with Zod Validation',
        content:
          'Zod is a TypeScript-first schema validation library that provides excellent type safety and runtime validation...',
        excerpt: 'Learn how to use Zod for schema validation in your TypeScript projects.',
        authorId: 1,
        published: true,
        publishedAt: new Date().toISOString(),
        tags: ['typescript', 'validation', 'zod'],
        metadata: {
          views: 1250,
          likes: 89,
          shares: 23,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        title: 'Advanced Zod Patterns and Best Practices',
        content:
          'Explore advanced Zod patterns including custom validators, transformations, and error handling...',
        excerpt: 'Deep dive into advanced Zod features for complex validation scenarios.',
        authorId: 2,
        published: false,
        publishedAt: null,
        tags: ['typescript', 'validation', 'advanced'],
        metadata: {
          views: 0,
          likes: 0,
          shares: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    let filteredPosts = posts
    if (published !== undefined) {
      filteredPosts = filteredPosts.filter((p) => p.published === Boolean(published))
    }
    if (author) {
      filteredPosts = filteredPosts.filter((p) => p.authorId === parseInt(author))
    }

    return response.json({
      data: filteredPosts,
      meta: {
        total: filteredPosts.length,
        page,
        perPage: limit,
        lastPage: Math.ceil(filteredPosts.length / limit),
      },
    })
  }

  @SwaggerInfo({
    tags: ['Posts'],
    summary: 'Get post by ID',
    description: 'Retrieve a specific blog post by its ID using Zod validation',
  })
  @SwaggerParam(
    {
      name: 'id',
      location: 'path',
      description: 'Post ID',
    },
    z.number().int().positive(),
    true
  )
  @SwaggerResponse(200, 'Post found', PostSchema)
  @SwaggerResponse(404, 'Post not found', ErrorSchema)
  async show({ params, response }: HttpContext) {
    const postId = params.id

    // Mock post data
    const post = {
      id: parseInt(postId),
      title: 'Getting Started with Zod Validation',
      content:
        'Zod is a TypeScript-first schema validation library that provides excellent type safety and runtime validation...',
      excerpt: 'Learn how to use Zod for schema validation in your TypeScript projects.',
      authorId: 1,
      published: true,
      publishedAt: new Date().toISOString(),
      tags: ['typescript', 'validation', 'zod'],
      metadata: {
        views: 1250,
        likes: 89,
        shares: 23,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return response.json(post)
  }

  @SwaggerInfo({
    tags: ['Posts'],
    summary: 'Create new post',
    description: 'Create a new blog post with Zod schema validation',
  })
  @SwaggerRequestBody('Post data', CreatePostSchema)
  @SwaggerResponse(201, 'Post created successfully', PostSchema)
  @SwaggerResponse(400, 'Validation error', ErrorSchema)
  @SwaggerResponse(422, 'Invalid input data', ErrorSchema)
  async store({ request, response }: HttpContext) {
    const data = request.all()

    // Mock post creation
    const post = {
      id: Math.floor(Math.random() * 1000) + 1,
      ...data,
      published: data.published ?? false,
      publishedAt: data.published ? new Date().toISOString() : null,
      tags: data.tags ?? [],
      metadata: {
        views: 0,
        likes: 0,
        shares: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return response.status(201).json(post)
  }

  @SwaggerInfo({
    tags: ['Posts'],
    summary: 'Update post',
    description: 'Update an existing blog post with Zod validation',
  })
  @SwaggerParam(
    {
      name: 'id',
      location: 'path',
      description: 'Post ID',
    },
    z.number().int().positive(),
    true
  )
  @SwaggerRequestBody('Post update data', UpdatePostSchema)
  @SwaggerResponse(200, 'Post updated successfully', PostSchema)
  @SwaggerResponse(404, 'Post not found', ErrorSchema)
  @SwaggerResponse(400, 'Validation error', ErrorSchema)
  async update({ params, request, response }: HttpContext) {
    const postId = params.id
    const data = request.all()

    // Mock post update
    const post = {
      id: parseInt(postId),
      title: data.title || 'Getting Started with Zod Validation',
      content: data.content || 'Zod is a TypeScript-first schema validation library...',
      excerpt: data.excerpt || 'Learn how to use Zod for schema validation.',
      authorId: 1,
      published: data.published ?? true,
      publishedAt: data.published !== false ? new Date().toISOString() : null,
      tags: data.tags || ['typescript', 'validation', 'zod'],
      metadata: {
        views: 1250,
        likes: 89,
        shares: 23,
      },
      createdAt: new Date('2023-01-01').toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return response.json(post)
  }

  @SwaggerInfo({
    tags: ['Posts'],
    summary: 'Delete post',
    description: 'Delete a blog post by ID',
  })
  @SwaggerParam(
    {
      name: 'id',
      location: 'path',
      description: 'Post ID',
    },
    z.number().int().positive(),
    true
  )
  @SwaggerResponse(204, 'Post deleted successfully')
  @SwaggerResponse(404, 'Post not found', ErrorSchema)
  async destroy({ params, response }: HttpContext) {
    const postId = params.id

    // Mock post deletion
    return response.status(204).send('')
  }
}
