import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from './user.js'
import Team from './team.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class TeamMiner extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare mineroId: string

  @column()
  declare equipoId: string

  @column()
  declare activo: boolean

  @column.dateTime()
  declare fechaAsignacion: DateTime

  @column.dateTime()
  declare fechaSalida: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'mineroId',
  })
  declare minero: BelongsTo<typeof User>

  @belongsTo(() => Team, {
    foreignKey: 'equipoId',
  })
  declare equipo: BelongsTo<typeof Team>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
