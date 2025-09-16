import type { HttpContext } from '@adonisjs/core/http'
import { Type } from '@sinclair/typebox'
import {
  SwaggerInfo,
  SwaggerResponse,
  SwaggerRequestBody,
  SwaggerParam,
  SwaggerHeader,
} from 'adonis-open-swagger'

// TypeBox schemas for validation and documentation
const ProductSchema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  name: Type.String({ minLength: 2, maxLength: 100 }),
  description: Type.String({ minLength: 10, maxLength: 500 }),
  price: Type.Number({ minimum: 0 }),
  categoryId: Type.Integer({ minimum: 1 }),
  inStock: Type.Boolean(),
  tags: Type.Array(Type.String()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
})

const CreateProductSchema = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 100 }),
  description: Type.String({ minLength: 10, maxLength: 500 }),
  price: Type.Number({ minimum: 0 }),
  categoryId: Type.Integer({ minimum: 1 }),
  inStock: Type.Optional(Type.Boolean()),
  tags: Type.Optional(Type.Array(Type.String())),
})

const UpdateProductSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 2, maxLength: 100 })),
  description: Type.Optional(Type.String({ minLength: 10, maxLength: 500 })),
  price: Type.Optional(Type.Number({ minimum: 0 })),
  categoryId: Type.Optional(Type.Integer({ minimum: 1 })),
  inStock: Type.Optional(Type.Boolean()),
  tags: Type.Optional(Type.Array(Type.String())),
})

const ProductListSchema = Type.Object({
  data: Type.Array(ProductSchema),
  meta: Type.Object({
    total: Type.Integer(),
    page: Type.Integer(),
    perPage: Type.Integer(),
    lastPage: Type.Integer(),
  }),
})

const ErrorSchema = Type.Object({
  message: Type.String(),
  code: Type.Optional(Type.String()),
  details: Type.Optional(Type.Any()),
})

export default class ProductsController {
  @SwaggerInfo({
    tags: ['Products'],
    summary: 'Get all products',
    description: 'Retrieve a paginated list of all products with TypeBox validation',
  })
  @SwaggerParam(
    {
      name: 'page',
      location: 'query',
      description: 'Page number for pagination',
    },
    Type.Optional(Type.Integer({ minimum: 1 }))
  )
  @SwaggerParam(
    {
      name: 'limit',
      location: 'query',
      description: 'Number of items per page',
    },
    Type.Optional(Type.Integer({ minimum: 1, maximum: 100 }))
  )
  @SwaggerParam(
    {
      name: 'category',
      location: 'query',
      description: 'Filter by category ID',
    },
    Type.Optional(Type.Integer({ minimum: 1 }))
  )
  @SwaggerHeader(
    {
      name: 'X-Client-Version',
      description: 'Client application version',
    },
    Type.Optional(Type.String())
  )
  @SwaggerResponse(200, 'Products retrieved successfully', ProductListSchema)
  @SwaggerResponse(400, 'Invalid query parameters', ErrorSchema)
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const category = request.input('category')

    // Mock data for demonstration
    const products = [
      {
        id: 1,
        name: 'Laptop Pro',
        description: 'High-performance laptop for professionals',
        price: 1299.99,
        categoryId: 1,
        inStock: true,
        tags: ['electronics', 'computers', 'professional'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        price: 49.99,
        categoryId: 1,
        inStock: true,
        tags: ['electronics', 'accessories', 'wireless'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    const filteredProducts = category
      ? products.filter((p) => p.categoryId === parseInt(category))
      : products

    return response.json({
      data: filteredProducts,
      meta: {
        total: filteredProducts.length,
        page,
        perPage: limit,
        lastPage: Math.ceil(filteredProducts.length / limit),
      },
    })
  }

  @SwaggerInfo({
    tags: ['Products'],
    summary: 'Get product by ID',
    description: 'Retrieve a specific product by its ID using TypeBox validation',
  })
  @SwaggerParam(
    {
      name: 'id',
      location: 'path',
      description: 'Product ID',
    },
    Type.Integer({ minimum: 1 }),
    true
  )
  @SwaggerResponse(200, 'Product found', ProductSchema)
  @SwaggerResponse(404, 'Product not found', ErrorSchema)
  async show({ params, response }: HttpContext) {
    const productId = params.id

    // Mock product data
    const product = {
      id: parseInt(productId),
      name: 'Laptop Pro',
      description: 'High-performance laptop for professionals',
      price: 1299.99,
      categoryId: 1,
      inStock: true,
      tags: ['electronics', 'computers', 'professional'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return response.json(product)
  }

  @SwaggerInfo({
    tags: ['Products'],
    summary: 'Create new product',
    description: 'Create a new product with TypeBox schema validation',
  })
  @SwaggerHeader(
    {
      name: 'Authorization',
      description: 'Bearer token for authentication',
    },
    Type.String(),
    true
  )
  @SwaggerRequestBody('Product data', CreateProductSchema)
  @SwaggerResponse(201, 'Product created successfully', ProductSchema)
  @SwaggerResponse(400, 'Validation error', ErrorSchema)
  @SwaggerResponse(422, 'Invalid input data', ErrorSchema)
  async store({ request, response }: HttpContext) {
    const data = request.all()

    // Mock product creation
    const product = {
      id: Math.floor(Math.random() * 1000) + 1,
      ...data,
      inStock: data.inStock ?? true,
      tags: data.tags ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return response.status(201).json(product)
  }

  @SwaggerInfo({
    tags: ['Products'],
    summary: 'Update product',
    description: 'Update an existing product with TypeBox validation',
  })
  @SwaggerParam(
    {
      name: 'id',
      location: 'path',
      description: 'Product ID',
    },
    Type.Integer({ minimum: 1 }),
    true
  )
  @SwaggerRequestBody('Product update data', UpdateProductSchema)
  @SwaggerResponse(200, 'Product updated successfully', ProductSchema)
  @SwaggerResponse(404, 'Product not found', ErrorSchema)
  @SwaggerResponse(400, 'Validation error', ErrorSchema)
  async update({ params, request, response }: HttpContext) {
    const productId = params.id
    const data = request.all()

    // Mock product update
    const product = {
      id: parseInt(productId),
      name: data.name || 'Laptop Pro',
      description: data.description || 'High-performance laptop for professionals',
      price: data.price || 1299.99,
      categoryId: data.categoryId || 1,
      inStock: data.inStock ?? true,
      tags: data.tags || ['electronics', 'computers', 'professional'],
      createdAt: new Date('2023-01-01').toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return response.json(product)
  }

  @SwaggerInfo({
    tags: ['Products'],
    summary: 'Delete product',
    description: 'Delete a product by ID',
  })
  @SwaggerParam(
    {
      name: 'id',
      location: 'path',
      description: 'Product ID',
    },
    Type.Integer({ minimum: 1 }),
    true
  )
  @SwaggerResponse(204, 'Product deleted successfully')
  @SwaggerResponse(404, 'Product not found', ErrorSchema)
  async destroy({ params, response }: HttpContext) {
    const productId = params.id

    // Mock product deletion
    return response.status(204).send('')
  }
}
