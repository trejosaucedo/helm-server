import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from './user.js'
import Team from './team.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare fromUserId: string

  @column()
  declare toUserId: string | null // Null si es grupal

  @column()
  declare equipoId: string | null // Null si es privado

  @column()
  declare mensaje: string

  @column()
  declare readBy: string | null // JSON de IDs que han leído (solo para grupal)

  @belongsTo(() => User, { foreignKey: 'fromUserId' })
  declare emisor: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'toUserId' })
  declare receptor: BelongsTo<typeof User>

  @belongsTo(() => Team, { foreignKey: 'equipoId' })
  declare equipo: BelongsTo<typeof Team>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
