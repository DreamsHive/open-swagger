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
    message: 'Zod Example API - Visit /docs for API documentation',
  }
})

// API routes with Zod validation examples
router
  .group(() => {
    // Post management routes
    router.get('/posts', '#controllers/posts_controller.index')
    router.get('/posts/:id', '#controllers/posts_controller.show')
    router.post('/posts', '#controllers/posts_controller.store')
    router.put('/posts/:id', '#controllers/posts_controller.update')
    router.delete('/posts/:id', '#controllers/posts_controller.destroy')

    // File upload routes with zodFile helper
    router.post('/posts/:id/image', '#controllers/posts_controller.uploadImage')
    router.post('/posts/:id/images', '#controllers/posts_controller.uploadMultipleImages')
  })
  .prefix('/api/v1')
