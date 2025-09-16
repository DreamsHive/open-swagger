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
    message: 'TypeBox Example API - Visit /docs for API documentation',
  }
})

// API routes with TypeBox validation examples
router
  .group(() => {
    // Product management routes
    router.get('/products', '#controllers/products_controller.index')
    router.get('/products/:id', '#controllers/products_controller.show')
    router.post('/products', '#controllers/products_controller.store')
    router.put('/products/:id', '#controllers/products_controller.update')
    router.delete('/products/:id', '#controllers/products_controller.destroy')
  })
  .prefix('/api/v1')
