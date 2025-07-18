import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.post('/register', '#controllers/auth_controller.register')
router.post('/login', '#controllers/auth_controller.login')
router
  .post('/access-codes', '#controllers/auth_controller.createAccessCodeForSupervisor')
  .use(middleware.auth('admin'))

router
  .group(() => {
    router.post('/logout', '#controllers/auth_controller.logout')
    router.post('/logout-all', '#controllers/auth_controller.logoutAll')
    router.get('/me', '#controllers/auth_controller.me')
    router.put('/change-password', '#controllers/auth_controller.changePassword')
    router.post('/register-minero', '#controllers/auth_controller.registerMinero')
    router.get('/sessions', '#controllers/auth_controller.getSessions')
    router.delete('/sessions/:sessionId', '#controllers/auth_controller.revokeSession')
  })
  .use(middleware.auth())

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

router.post('/cascos', '#controllers/casco_controller.create').use(middleware.auth('supervisor'))
router.delete('/cascos/clean', '#controllers/casco_controller.cleanCascos')

router
  .group(() => {
    router.get('/', '#controllers/notification_controller.index')
    router.get('/count', '#controllers/notification_controller.unreadCount')
    router.post('/:id/read', '#controllers/notification_controller.markRead')
    router.post('/read-all', '#controllers/notification_controller.markAllRead')
    router.delete('/:id', '#controllers/notification_controller.destroy')
    router.delete('/clear', '#controllers/notification_controller.clearRead')
  })
  .prefix('/notifications')
  .use(middleware.auth())

router
  .post('/notifications/bulk', '#controllers/notification_controller.bulkStore')
  .use(middleware.auth('admin'))
router
  .get('/notifications/stats', '#controllers/notification_controller.stats')
  .use(middleware.auth('admin'))
router
  .post('/notifications/supervisor', '#controllers/notification_controller.sendSupervisorMessage')
  .use(middleware.auth('supervisor'))
router
  .post('/device-tokens', '#controllers/notification_controller.registerDeviceToken')
  .use(middleware.auth())

// --- Sensores ---
router
  .group(() => {
    router.post('/', '#controllers/sensor_controller.store').use(middleware.auth('supervisor'))
    router.put('/:id', '#controllers/sensor_controller.update').use(middleware.auth('supervisor'))
    router
      .get('/casco/:cascoId', '#controllers/sensor_controller.getByCasco')
      .use(middleware.auth())
    router
      .get('/minero/:mineroId', '#controllers/sensor_controller.getByMinero')
      .use(middleware.auth())
  })
  .prefix('/sensors')

// --- Lecturas de sensores ---
router
  .group(() => {
    router.post('/readings', '#controllers/sensor_reading_controller.ingestReading')
    router.post('/readings/batch', '#controllers/sensor_reading_controller.ingestBatchReadings')
    router
      .get('/readings', '#controllers/sensor_reading_controller.getReadings')
      .use(middleware.auth())
    router
      .get('/readings/recent/:mineroId', '#controllers/sensor_reading_controller.getRecentReadings')
      .use(middleware.auth())
    router
      .get('/:sensorId/stats', '#controllers/sensor_reading_controller.getSensorStats')
      .use(middleware.auth())
  })
  .prefix('/sensors')

// Dispositivos IoT
router.post(
  '/cascos/:cascoId/sensores/:sensorId',
  '#controllers/sensor_controller.publishSensorData'
)

router
  .group(() => {
    router.get('/:teamId/miners', '#controllers/team_controller.getTeamMiners')
    router.post('/', '#controllers/team_controller.create').use(middleware.auth('supervisor'))
    router
      .post('/:teamId/assign-miner', '#controllers/team_controller.assignMinerToTeam')
      .use(middleware.auth('supervisor'))
    router
      .get('/supervisor', '#controllers/team_controller.getTeamsBySupervisor')
      .use(middleware.auth('supervisor'))
  })
  .prefix('/teams')
  .use(middleware.auth())

router.get('/health', ({ response }) => {
  return response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'helm-server',
    version: '1.0.0',
  })
})
