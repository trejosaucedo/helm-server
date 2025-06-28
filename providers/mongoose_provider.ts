import mongoose from 'mongoose'
import { mongooseConfig } from '#config/mongoose'
import type { ApplicationService } from '@adonisjs/core/types'

export default class MongooseProvider {
  constructor(protected app: ApplicationService) {}

  async register() {}

  async boot() {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established')
    })

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected')
    })

    await this.start()
  }

  async start() {
    while (true) {
      try {
        await mongoose.connect(mongooseConfig.url as string)
        console.log('MongoDB conectado exitosamente')
        break
      } catch (error) {
        console.error('Error conectando a MongoDB:', error)
        console.log('Reintentando en 5 segundos...')
        await new Promise((resolve) => setTimeout(resolve, 30000))
      }
    }
  }

  async shutdown() {
    await mongoose.disconnect()
    console.log('MongoDB desconectado')
  }
}
