import vine from '@vinejs/vine'

export const UserSchema = vine.object({
  id: vine.number().positive(),
  name: vine.string().minLength(2).maxLength(50),
  email: vine.string().email(),
  age: vine.number().min(18).max(120).optional(),
  createdAt: vine.date(),
  updatedAt: vine.date(),
})

export const CreateUserSchema = vine.object({
  name: vine.string().minLength(2).maxLength(50),
  email: vine.string().email(),
  age: vine.number().min(18).max(120).optional(),
})

export const UpdateUserSchema = vine.object({
  name: vine.string().minLength(2).maxLength(50).optional(),
  email: vine.string().email().optional(),
  age: vine.number().min(18).max(120).optional(),
})

export const UserListSchema = vine.object({
  data: vine.array(UserSchema),
  meta: vine.object({
    total: vine.number(),
    page: vine.number(),
    perPage: vine.number(),
    lastPage: vine.number(),
  }),
})
