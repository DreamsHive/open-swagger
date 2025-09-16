import vine from '@vinejs/vine'

// Schemas
import {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserListSchema,
} from '../schemas/user.schema.js'

// Validators
export const validateUser = vine.compile(UserSchema)

export const validateCreateUser = vine.compile(CreateUserSchema)

export const validateUpdateUser = vine.compile(UpdateUserSchema)

export const validateUserList = vine.compile(UserListSchema)

export const validateUserJSON = validateUser.toJSON()
