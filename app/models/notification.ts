import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import User from './user.js'
import { randomUUID } from 'node:crypto'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'user_id' })
  declare userId: string

  @column()
  declare type: 'general' | 'sensor' | 'supervisor'

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare data: any

  @column({ columnName: 'is_read' })
  declare isRead: boolean

  @column({ columnName: 'is_error' })
  declare isError: boolean

  @column({ columnName: 'error_comment' })
  declare errorComment: string | null

  @column({ columnName: 'priority' })
  declare priority: 'low' | 'medium' | 'high' | 'critical'

  @column({ columnName: 'delivery_channels' })
  declare deliveryChannels: string[] // ['database', 'email', 'push']

  @column({ columnName: 'email_sent' })
  declare emailSent: boolean

  @column({ columnName: 'push_sent' })
  declare pushSent: boolean

  @column.dateTime({ columnName: 'read_at' })
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @beforeCreate()
  public static assignUuid(notification: Notification) {
    if (!notification.id) {
      notification.id = randomUUID()
    }
  }

  // Método para determinar si debe enviarse por email
  public shouldSendEmail(): boolean {
    return this.deliveryChannels.includes('email') && 
           ['high', 'critical'].includes(this.priority)
  }

  // Método para determinar si debe enviarse push
  public shouldSendPush(): boolean {
    return this.deliveryChannels.includes('push') && 
           ['medium', 'high', 'critical'].includes(this.priority)
  }
}