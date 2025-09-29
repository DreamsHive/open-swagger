/**
 * Example usage of generated TypeScript types from OpenAPI components
 * This demonstrates how the new components feature enables type-safe API development
 */

import { components } from './api-schema.js'

// Extract component types - this is now possible thanks to the components feature!
type User = components['schemas']['UserSchema']
type CreateUser = components['schemas']['CreateUserSchema']
type UpdateUser = components['schemas']['UpdateUserSchema']
type UserList = components['schemas']['UserListSchema']

// Example usage in application code
export class UserApiClient {
  /**
   * Create a new user with type safety
   */
  async createUser(data: CreateUser): Promise<User> {
    // TypeScript ensures correct data structure
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json() as Promise<User>
  }

  /**
   * Get user by ID with full type safety
   */
  async getUser(id: number): Promise<User> {
    const response = await fetch(`/api/users/${id}`)
    return response.json() as Promise<User>
  }

  /**
   * Update user with partial data
   */
  async updateUser(id: number, updates: UpdateUser): Promise<User> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return response.json() as Promise<User>
  }

  /**
   * Get paginated list of users
   */
  async getUsers(page: number = 1, perPage: number = 10): Promise<UserList> {
    const response = await fetch(`/api/users?page=${page}&perPage=${perPage}`)
    return response.json() as Promise<UserList>
  }

  /**
   * Delete user by ID
   */
  async deleteUser(id: number): Promise<void> {
    await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    })
  }
}

// Example utility functions for working with typed data
export function displayUser(user: User): string {
  return `${user.name} (${user.email})`
}

export function formatUserAge(user: User): string {
  return user.age ? `${user.age} years old` : 'Age not specified'
}

// Type guard for runtime type checking
export function isUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.createdAt === 'string' &&
    typeof obj.updatedAt === 'string'
  )
}

// Example validation function
export function validateCreateUserData(data: any): data is CreateUser {
  return (
    data &&
    typeof data.name === 'string' &&
    data.name.length >= 2 &&
    data.name.length <= 50 &&
    typeof data.email === 'string' &&
    data.email.includes('@') &&
    (data.age === undefined || (typeof data.age === 'number' && data.age >= 18 && data.age <= 120))
  )
}

/**
 * Benefits of the Components Feature:
 *
 * 1. Type Safety: All API interactions are type-safe
 * 2. IntelliSense: Full IDE support with autocomplete
 * 3. Refactoring: Safe refactoring across the codebase
 * 4. Documentation: Types serve as living documentation
 * 5. Error Prevention: Catch type mismatches at compile time
 * 6. Consistency: Ensures frontend and backend stay in sync
 * 7. Developer Experience: Faster development with fewer bugs
 */
