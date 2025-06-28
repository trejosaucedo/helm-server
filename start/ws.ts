import app from '@adonisjs/core/services/app'
import server from '@adonisjs/core/services/server'
import { Server } from 'socket.io'

let io: Server | null = null

app.ready(() => {
  io = new Server(server.getNodeServer(), {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })

    // Eventos para sensores (configuración base)
    socket.on('sensor-data', (data) => {
      console.log('Sensor data received:', data)
    })
  })
})

export { io }
