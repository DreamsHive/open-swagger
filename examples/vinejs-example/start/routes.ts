/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  return {
    hello: 'world',
    message: 'VineJS Example API - Visit /docs for API documentation',
  }
})

// OpenAPI documentation routes are automatically registered by the provider

// API routes with VineJS validation examples
router
  .group(() => {
    // User management routes
    router.get('/users', '#controllers/users_controller.index')
    router.get('/users/:id', '#controllers/users_controller.show')
    router.post('/users', '#controllers/users_controller.store')
    router.put('/users/:id', '#controllers/users_controller.update')
    router.delete('/users/:id', '#controllers/users_controller.destroy')
  })
  .prefix('/api/v1')
