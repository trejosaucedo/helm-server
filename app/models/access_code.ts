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

  @column.dateTime({ useTz: false })
  declare fechaGeneracion: DateTime

  @column.dateTime({ useTz: false })
  declare fechaUso: DateTime | null

  @column.dateTime({ autoCreate: true, useTz: false })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, useTz: false })
  declare updatedAt: DateTime | null
}
