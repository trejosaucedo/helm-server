import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import {
  BaseModel,
  column,
  beforeCreate,
  hasMany,
  belongsTo,
} from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { randomUUID } from 'node:crypto'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Casco from './casco.js'
import TeamMiner from './team_miner.js'
import Notification from './notification.js'
import Message from './message.js'

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

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'admin' | 'supervisor' | 'minero'

  @column()
  declare estado: 'activo' | 'inactivo'

  // ---- CAMPOS SOLO PARA MINERO ----
  @column()
  declare cascoId: string | null

  @column()
  declare supervisorId: string | null

  @column.dateTime()
  declare fechaContratacion: DateTime | null

  @column()
  declare especialidadEnMineria: string | null

  @column()
  declare genero: 'masculino' | 'femenino' | null

  // Un supervisor tiene muchos cascos
  @hasMany(() => Casco, {
    foreignKey: 'supervisorId',
  })
  declare cascos: HasMany<typeof Casco>

  // Un supervisor tiene muchos mineros
  @hasMany(() => User, {
    foreignKey: 'supervisorId',
  })
  declare mineros: HasMany<typeof User>

  // Un minero pertenece a un supervisor
  @belongsTo(() => User, {
    foreignKey: 'supervisorId',
  })
  declare supervisor: BelongsTo<typeof User>

  // Historial de equipos como minero
  @hasMany(() => TeamMiner, {
    foreignKey: 'mineroId',
  })
  declare historialEquipos: HasMany<typeof TeamMiner>

  // Notificaciones recibidas
  @hasMany(() => Notification, {
    foreignKey: 'userId',
  })
  declare notificaciones: HasMany<typeof Notification>

  // Mensajes enviados
  @hasMany(() => Message, {
    foreignKey: 'fromUserId',
  })
  declare mensajesEnviados: HasMany<typeof Message>

  // Mensajes recibidos (solo directos)
  @hasMany(() => Message, {
    foreignKey: 'toUserId',
  })
  declare mensajesRecibidos: HasMany<typeof Message>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static assignUuid(user: User) {
    if (!user.id) {
      user.id = randomUUID()
    }
  }
}
