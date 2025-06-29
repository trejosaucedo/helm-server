import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, beforeCreate, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import redis from '@adonisjs/redis/services/main'
import { randomBytes, randomUUID } from 'node:crypto'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Casco from './casco.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare role: 'supervisor' | 'minero'

  @column()
  declare cascoId: string | null

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Casco, {
    foreignKey: 'supervisorId',
  })
  declare cascos: HasMany<typeof Casco>

  @beforeCreate()
  static assignUuid(user: User) {
    if (!user.id) {
      user.id = randomUUID()
    }
  }

  async generateToken() {
    const tokenId = randomBytes(32).toString('hex')
    const tokenData = {
      userId: this.id,
      email: this.email,
      role: this.role,
      cascoId: this.cascoId,
      createdAt: new Date().toISOString(),
    }

    // Verificar sesiones activas actuales
    const currentSessions = await redis.smembers(`user:${this.id}:sessions`)

    // Si ya hay 5 sesiones, eliminar la más antigua
    if (currentSessions.length === 5) {
      // Obtener los datos de todas las sesiones para encontrar la más antigua
      const sessionPromises = currentSessions.map(async (sessionId) => {
        const sessionData = await redis.get(`auth:token:${sessionId}`)
        return sessionData
          ? {
              id: sessionId,
              data: JSON.parse(sessionData),
            }
          : null
      })

      const sessions = (await Promise.all(sessionPromises))
        .filter((session) => session !== null)
        .sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime())

      if (sessions.length > 0) {
        const oldestSession = sessions[0]
        await redis.del(`auth:token:${oldestSession.id}`)
        await redis.srem(`user:${this.id}:sessions`, oldestSession.id)
      }
    }

    // Crear la nueva sesión
    await redis.setex(`auth:token:${tokenId}`, 86400, JSON.stringify(tokenData))
    await redis.sadd(`user:${this.id}:sessions`, tokenId)
    await redis.expire(`user:${this.id}:sessions`, 86400)

    return tokenId
  }

  static async validateToken(tokenId: string) {
    const tokenData = await redis.get(`auth:token:${tokenId}`)
    if (!tokenData) return null

    const parsed = JSON.parse(tokenData)
    const user = await User.find(parsed.userId)

    if (!user) {
      await redis.del(`auth:token:${tokenId}`)
      return null
    }

    return { user, tokenData: parsed }
  }

  async revokeToken(tokenId: string) {
    await redis.del(`auth:token:${tokenId}`)
    await redis.srem(`user:${this.id}:sessions`, tokenId)
  }

  async revokeAllTokens() {
    const sessions = await redis.smembers(`user:${this.id}:sessions`)
    if (sessions.length > 0) {
      const pipeline = redis.pipeline()
      sessions.forEach((tokenId) => {
        pipeline.del(`auth:token:${tokenId}`)
      })
      pipeline.del(`user:${this.id}:sessions`)
      await pipeline.exec()
    }
  }

  isSupervisor(): boolean {
    return this.role === 'supervisor'
  }

  isMinero(): boolean {
    return this.role === 'minero'
  }
}
