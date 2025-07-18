import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { Server } from 'socket.io'
import { WebSocketService } from '#services/websocket_service'

let io: Server | null = null
let wsService: WebSocketService | null = null

app.ready(() => {
  io = new Server(server.getNodeServer(), {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Crear instancia del servicio WebSocket
  wsService = new WebSocketService(io)

  // Manejar conexiones
  io.on('connection', (socket) => {
    wsService?.handleConnection(socket)
  })
})

// Exportar para uso en otros archivos
export { io, wsService }
