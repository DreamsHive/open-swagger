import vine from '@vinejs/vine'
import * as userSchema from './user.schema.js'

export const user = vine.object(userSchema.userSchema)
