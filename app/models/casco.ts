import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from './user.js'
import Sensor from './sensor.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Casco extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare serial: string

  @column()
  declare physicalId: string

  @column()
  declare isActive: boolean

  @column()
  declare asignadoSupervisor: boolean

  @column()
  declare asignadoMinero: boolean

  @column()
  declare supervisorId: string | null

  @column()
  declare mineroId: string | null

  @column.dateTime()
  declare fechaActivacion: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'supervisorId',
  })
  declare supervisor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'mineroId',
  })
  declare minero: BelongsTo<typeof User>

  @hasMany(() => Sensor, {
    foreignKey: 'cascoId',
  })
  declare sensores: HasMany<typeof Sensor>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static async assignUuid(casco: Casco) {
    casco.id = randomUUID()
  }
}
