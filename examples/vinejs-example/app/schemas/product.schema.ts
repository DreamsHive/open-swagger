import vine from '@vinejs/vine'

// Product category schema
export const productCategorySchema = vine.object({
  id: vine.string(),
  name: vine.string(),
  description: vine.string().nullable(),
  createdAt: vine.string(),
  updatedAt: vine.string(),
})

// Product schema
export const productSchema = vine.object({
  id: vine.string(),
  name: vine.string(),
  description: vine.string().nullable(),
  price: vine.number().positive(),
  currency: vine.string(),
  sku: vine.string(),
  inStock: vine.boolean(),
  categoryId: vine.string(),
  category: productCategorySchema.nullable(),
  tags: vine.array(vine.string()),
  metadata: vine.object({}).allowUnknownProperties().nullable(),
  createdAt: vine.string(),
  updatedAt: vine.string(),
})

// Product list response schema
export const productListResponseSchema = vine.object({
  data: vine.array(productSchema),
  meta: vine.object({
    total: vine.number(),
    page: vine.number(),
    perPage: vine.number(),
    lastPage: vine.number(),
  }),
})

// Create product schema
export const createProductSchema = vine.object({
  name: vine.string(),
  description: vine.string().nullable(),
  price: vine.number().positive(),
  currency: vine.string(),
  sku: vine.string(),
  categoryId: vine.string(),
  tags: vine.array(vine.string()).optional(),
  metadata: vine.object({}).allowUnknownProperties().nullable(),
})

// Update product schema
export const updateProductSchema = vine.object({
  name: vine.string().optional(),
  description: vine.string().nullable().optional(),
  price: vine.number().positive().optional(),
  currency: vine.string().optional(),
  sku: vine.string().optional(),
  categoryId: vine.string().optional(),
  inStock: vine.boolean().optional(),
  tags: vine.array(vine.string()).optional(),
  metadata: vine.object({}).allowUnknownProperties().nullable().optional(),
})
