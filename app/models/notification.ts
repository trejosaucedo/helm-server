import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare type: 'sensor_alert' | 'system' | 'supervisor_message'

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare priority: string

  @column()
  declare isRead: boolean

  @column()
  declare data: string | null // JSON con info específica del tipo

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static assignUuid(notification: Notification) {
    if (!notification.id) {
      notification.id = randomUUID()
    }
  }

  // Helper methods
  public setData(data: any): void {
    this.data = JSON.stringify(data)
  }

  public getData(): any {
    return this.data ? JSON.parse(this.data) : null
  }
}
