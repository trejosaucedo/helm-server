import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare type: string // Ej: 'alerta_sensor', 'asignacion a equipo minero o asignacion de casco', etc.

  @column()
  declare mensaje: string

  @column()
  declare data: string // JSON.stringify({ casco, sensor, valores, etc. })

  @column()
  declare canal: string // 'correo', 'push', 'web', o combinación (ej: 'app,correo')

  @column()
  declare read: boolean

  @column.dateTime()
  declare fechaEnvio: DateTime

  @column.dateTime()
  declare fechaLeido: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare usuario: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
