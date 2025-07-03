import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Casco extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare physicalId: string

  @column()
  declare supervisorId: string | null

  @column()
  declare mineroId: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'supervisorId',
  })
  declare supervisor: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'mineroId',
  })
  declare minero: BelongsTo<typeof User>

  @beforeCreate()
  static assignUuid(casco: Casco) {
    if (!casco.id) {
      casco.id = randomUUID()
    }
  }
}
