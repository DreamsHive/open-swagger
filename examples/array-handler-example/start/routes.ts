/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

// Example using the new array handler format with import statements
const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')

router.get('/', async () => {
  return {
    hello: 'world',
    message: 'Array Handler Example API - Visit /docs for API documentation',
  }
})

// Authentication routes using array handler format
router
  .group(() => {
    router.post('login', [AuthController, 'login']).as('login')
    router.post('logout', [AuthController, 'logout']).as('logout')
    router.post('register', [AuthController, 'register']).as('register')
  })
  .as('auth')
  .prefix('api/auth')

// User management routes using array handler format
router
  .group(() => {
    router.get('users', [UsersController, 'index']).as('index')
    router.get('users/:id', [UsersController, 'show']).as('show')
    router.post('users', [UsersController, 'store']).as('store')
    router.put('users/:id', [UsersController, 'update']).as('update')
    router.delete('users/:id', [UsersController, 'destroy']).as('destroy')
  })
  .as('users')
  .prefix('api/v1')

// Mixed usage - some routes with array handlers, some with string handlers
router
  .group(() => {
    // Array handler
    router.get('profile', [UsersController, 'profile']).as('profile')
    
    // String handler (existing format)
    router.get('settings', '#controllers/users_controller.settings').as('settings')
  })
  .as('user')
  .prefix('api/user')
