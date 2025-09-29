import vine from '@vinejs/vine'

// Order status enum-like schema
export const orderStatusSchema = vine.string().in(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])

// Order item schema
export const orderItemSchema = vine.object({
  id: vine.string(),
  orderId: vine.string(),
  productId: vine.string(),
  productName: vine.string(),
  quantity: vine.number().positive(),
  unitPrice: vine.number().positive(),
  totalPrice: vine.number().positive(),
  createdAt: vine.string(),
  updatedAt: vine.string(),
})

// Order schema
export const orderSchema = vine.object({
  id: vine.string(),
  userId: vine.string(),
  status: orderStatusSchema,
  subtotal: vine.number().positive(),
  tax: vine.number().min(0),
  shipping: vine.number().min(0),
  total: vine.number().positive(),
  currency: vine.string(),
  shippingAddress: vine.object({
    street: vine.string(),
    city: vine.string(),
    state: vine.string(),
    zipCode: vine.string(),
    country: vine.string(),
  }),
  billingAddress: vine.object({
    street: vine.string(),
    city: vine.string(),
    state: vine.string(),
    zipCode: vine.string(),
    country: vine.string(),
  }).nullable(),
  items: vine.array(orderItemSchema),
  notes: vine.string().nullable(),
  createdAt: vine.string(),
  updatedAt: vine.string(),
})

// Create order schema
export const createOrderSchema = vine.object({
  userId: vine.string(),
  items: vine.array(vine.object({
    productId: vine.string(),
    quantity: vine.number().positive(),
  })),
  shippingAddress: vine.object({
    street: vine.string(),
    city: vine.string(),
    state: vine.string(),
    zipCode: vine.string(),
    country: vine.string(),
  }),
  billingAddress: vine.object({
    street: vine.string(),
    city: vine.string(),
    state: vine.string(),
    zipCode: vine.string(),
    country: vine.string(),
  }).nullable(),
  notes: vine.string().nullable(),
})

// Order list response schema
export const orderListResponseSchema = vine.object({
  data: vine.array(orderSchema),
  meta: vine.object({
    total: vine.number(),
    page: vine.number(),
    perPage: vine.number(),
    lastPage: vine.number(),
  }),
})
