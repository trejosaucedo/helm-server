import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from './user.js'
import TeamMiner from './team_miner.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Team extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare nombre: string

  @column()
  declare zona: string

  @column()
  declare supervisorId: string

  @belongsTo(() => User, {
    foreignKey: 'supervisorId',
  })
  declare supervisor: BelongsTo<typeof User>

  @hasMany(() => TeamMiner, {
    foreignKey: 'equipoId',
  })
  declare mineros: HasMany<typeof TeamMiner>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static assignUuid(team: Team) {
    if (!team.id) {
      team.id = randomUUID()
    }
  }
}
