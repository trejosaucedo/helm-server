import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// --- Autenticación ---
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

// --- Cascos (helmets) ---
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
  .use(middleware.auth(['admin', 'supervisor']))

router.post('/cascos', '#controllers/casco_controller.create').use(middleware.auth(['admin', 'supervisor']))
router.delete('/cascos/clean', '#controllers/casco_controller.cleanCascos')
router.get('/cascos/:id', '#controllers/casco_controller.getCasco').use(middleware.auth(['admin', 'supervisor']))
router.put('/cascos/:id', '#controllers/casco_controller.updateCasco').use(middleware.auth(['admin', 'supervisor']))
router.delete('/cascos/:id', '#controllers/casco_controller.deleteCasco').use(middleware.auth(['admin', 'supervisor']))

// --- Notificaciones ---
router
  .group(() => {
    router.get('/', '#controllers/notification_controller.index')
    router.get('/unread-count', '#controllers/notification_controller.unreadCount')
    router.post('/:id/read', '#controllers/notification_controller.markAsRead')
    router.post('/read-all', '#controllers/notification_controller.markAllAsRead')
    router.delete('/:id', '#controllers/notification_controller.delete')
    router.post('/supervisor-message', '#controllers/notification_controller.sendSupervisorMessage')
  })
  .prefix('/notifications')
  .use(middleware.auth())

// --- Sensores: administración (SensorController) ---
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

// --- Sensores: lecturas (SensorReadingController) ---
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
    router
      .get(
        '/sensors/:sensorId/recent-cache',
        '#controllers/sensor_reading_controller.recentReadingsFromRedis'
      )
      .use(middleware.auth())
  })
  .prefix('/sensors')

// --- Dispositivos IoT: lectura directa desde Raspberry ---
router.post(
  '/cascos/:cascoId/sensores/:sensorId',
  '#controllers/sensor_controller.publishSensorData'
)

// --- Equipos (teams) ---
router
  .group(() => {
    router.get('/', '#controllers/team_controller.list')
    router.get('/stats', '#controllers/team_controller.stats')
    router.get('/:teamId/miners', '#controllers/team_controller.getTeamMiners')
    router.post('/', '#controllers/team_controller.create').use(middleware.auth(['admin', 'supervisor']))
    router
      .post('/:teamId/assign-miner', '#controllers/team_controller.assignMinerToTeam')
      .use(middleware.auth(['admin', 'supervisor']))
    router
      .get('/supervisor', '#controllers/team_controller.getTeamsBySupervisor')
      .use(middleware.auth('supervisor'))
  })
  .prefix('/teams')
  .use(middleware.auth())

router.get('/teams/:id', '#controllers/team_controller.getTeam').use(middleware.auth(['admin', 'supervisor']))
router.put('/teams/:id', '#controllers/team_controller.updateTeam').use(middleware.auth(['admin', 'supervisor']))
router.delete('/teams/:id', '#controllers/team_controller.deleteTeam').use(middleware.auth(['admin', 'supervisor']))

// --- Supervisores ---
router.get('/supervisors', '#controllers/auth_controller.listSupervisors').use(middleware.auth('admin'))

// --- Mineros ---
router.get('/mineros', '#controllers/auth_controller.listMiners').use(middleware.auth('admin'))
router.get('/mineros/stats', '#controllers/auth_controller.minersStats').use(middleware.auth('admin'))
router.get('/mineros/:id', '#controllers/auth_controller.getMinero').use(middleware.auth('admin'))
router.get('/access-codes', '#controllers/auth_controller.getAllAccessCodes').use(middleware.auth('admin'))
router.get('/access-codes/:email', '#controllers/auth_controller.getAccessCodesByEmail').use(middleware.auth('admin'))
router.post('/mineros', '#controllers/auth_controller.registerMinero').use(middleware.auth(['admin', 'supervisor']))
router.put('/mineros/:id', '#controllers/auth_controller.updateMinero').use(middleware.auth('admin'))
router.delete('/mineros/:id', '#controllers/auth_controller.deleteMinero').use(middleware.auth('admin'))

// --- Health check ---
router.get('/health', ({ response }) => {
  return response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'helm-server',
    version: '1.0.0',
  })
})
