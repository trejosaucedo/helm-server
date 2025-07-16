import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { Server } from 'socket.io'
import { wsAuthMiddleware } from '../app/middleware/ws_auth_middleware.js'
import { WebSocketService } from '../app/services/websocket_service.js'

let io: Server | null = null
let wsService: WebSocketService | null = null

app.ready(() => {
  io = new Server(server.getNodeServer(), {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
  })

  // Crear instancia del servicio WebSocket
  wsService = new WebSocketService(io)

  // Usar middleware de autenticación
  io.use(wsAuthMiddleware)

  // Manejar conexiones
  io.on('connection', (socket) => {
    wsService?.handleConnection(socket)
  })
})

// Exportar para uso en otros archivos
export { io, wsService }
