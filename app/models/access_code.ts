import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'

export default class AccessCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare codigo: string

  @column()
  declare correo_supervisor: string

  @column()
  declare usado: boolean

  @column.dateTime()
  declare fecha_generacion: DateTime

  @column.dateTime()
  declare fecha_uso: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime | null

  @beforeCreate()
  static async assignUuid(accessCode: AccessCode) {
    accessCode.id = randomUUID()
  }
}
