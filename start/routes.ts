import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// ------------------------
// Auth públicas
// ------------------------
router.post('/register', '#controllers/auth_controller.register')
router.post('/login', '#controllers/auth_controller.login')

// ------------------------
// Auth protegidas
// ------------------------
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

// ------------------------
// Cascos (solo supervisores)
// ------------------------
router
  .group(() => {
    router.post('/activate', '#controllers/casco_controller.activate')
    router.post('/deactivate', '#controllers/casco_controller.desactivate')
    router.get('/my-helmets', '#controllers/casco_controller.myHelmets')
    router.get('/available', '#controllers/casco_controller.available')
    router.post('/assign', '#controllers/casco_controller.assign')
    router.post('/unassign', '#controllers/casco_controller.unassign')
  })
  .prefix('/cascos')
  .use(middleware.auth('supervisor'))

// Crear casco (solo admin)
router.post('/cascos', '#controllers/casco_controller.create').use(middleware.auth('admin'))

// ------------------------
// Notificaciones (usuario autenticado)
// ------------------------
router
  .group(() => {
    // Listar notificaciones (paginado)
    router.get('/', '#controllers/notification_controller.index')
    // Conteo no leídas
    router.get('/count', '#controllers/notification_controller.unreadCount')
    // Marcar como leída
    router.post('/:id/read', '#controllers/notification_controller.markRead')
    // Marcar todas como leídas
    router.post('/read-all', '#controllers/notification_controller.markAllRead')
    // Marcar como errónea (feedback usuario)
    router.post('/:id/error', '#controllers/notification_controller.markAsError')
    // Eliminar una específica
    router.delete('/:id', '#controllers/notification_controller.destroy')
    // Limpiar todas leídas
    router.delete('/clear', '#controllers/notification_controller.clearRead')
  })
  .prefix('/notifications')
  .use(middleware.auth())

// ------------------------
// Notificaciones: creación y stats
// ------------------------
// Crear notificación manual (admin o supervisor)
router
  .post('/notifications', '#controllers/notification_controller.store')
  .use(middleware.auth('admin'))

// Crear múltiples notificaciones (bulk) (admin o supervisor)
router
  .post('/notifications/bulk', '#controllers/notification_controller.bulkStore')
  .use(middleware.auth('admin'))

// Obtener estadísticas de notificaciones (admin o supervisor)
router
  .get('/notifications/stats', '#controllers/notification_controller.stats')
  .use(middleware.auth('admin'))

// Enviar mensaje de supervisor a mineros/equipos
router
  .post('/notifications/supervisor', '#controllers/notification_controller.sendSupervisorMessage')
  .use(middleware.auth('supervisor'))

// Registro de tokens de push (todos los usuarios autenticados)
router
  .post('/device-tokens', '#controllers/notification_controller.registerDeviceToken')
  .use(middleware.auth())

// ------------------------
// Sensores: ingestión de datos
// ------------------------
router
  .group(() => {
    // Crear sensor (solo supervisor)
    router.post('/', '#controllers/sensor_controller.store').use(middleware.auth('supervisor'))

    // Actualizar sensor (solo supervisor)
    router.put('/:id', '#controllers/sensor_controller.update').use(middleware.auth('supervisor'))

    // Obtener sensores por casco
    router
      .get('/casco/:cascoId', '#controllers/sensor_controller.getByCasco')
      .use(middleware.auth())

    // Obtener sensores por minero
    router
      .get('/minero/:mineroId', '#controllers/sensor_controller.getByMinero')
      .use(middleware.auth())

    // Obtener estadísticas de sensor
    router.get('/:id/stats', '#controllers/sensor_controller.getSensorStats').use(middleware.auth())

    // Ingestión de lecturas (sin autenticación para dispositivos)
    router.post('/readings', '#controllers/sensor_controller.ingestReading')
    router.post('/readings/batch', '#controllers/sensor_controller.ingestBatchReadings')

    // Consultar lecturas (con autenticación)
    router.get('/readings', '#controllers/sensor_controller.getReadings').use(middleware.auth())
    router
      .get('/readings/recent/:mineroId', '#controllers/sensor_controller.getRecentReadings')
      .use(middleware.auth())
  })
  .prefix('/sensors')

// ------------------------
// Fin de routes.ts
// ------------------------
