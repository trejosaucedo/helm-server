import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AccessCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare codigo: string

  @column()
  declare correoSupervisor: string

  @column()
  declare usado: boolean

  @column.dateTime()
  declare fechaGeneracion: DateTime

  @column.dateTime()
  declare fechaUso: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
