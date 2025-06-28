import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.post('/register', '#controllers/auth_controller.register')
router.post('/login', '#controllers/auth_controller.login')

router
  .group(() => {
    router.post('/logout', '#controllers/auth_controller.logout')
    router.get('/me', '#controllers/auth_controller.me')
  })
  .use(middleware.auth())
