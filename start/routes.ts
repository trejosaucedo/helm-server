import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Rutas públicas de autenticación
router.post('/register', '#controllers/auth_controller.register')
router.post('/login', '#controllers/auth_controller.login')

// Rutas protegidas de autenticación
router
  .group(() => {
    router.post('/logout', '#controllers/auth_controller.logout')
    router.post('/logout-all', '#controllers/auth_controller.logoutAll')
    router.get('/me', '#controllers/auth_controller.me')
    router.put('/change-password', '#controllers/auth_controller.changePassword')

    // Registro de mineros (solo supervisores)
    router.post('/register-minero', '#controllers/auth_controller.registerMinero')
  })
  .use(middleware.auth())

router
  .group(() => {
    router.post('/', '#controllers/casco_controller.create').middleware([middleware.isAdmin()])
    router.post('/activate', '#controllers/casco_controller.activate')
    router.post('/deactivate', '#controllers/casco_controller.desactivate')
    router.get('/', '#controllers/casco_controller.index')
    router.get('/available', '#controllers/casco_controller.available')
    router.post('/assign', '#controllers/casco_controller.assign')
    router.post('/unassign', '#controllers/casco_controller.unassign')
  })
  .prefix('/cascos')
  .use(middleware.auth())
