import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare type: 'general' | 'sensor' | 'supervisor'

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare priority: 'low' | 'medium' | 'high' | 'critical'

  @column()
  declare data: string | null // JSON.stringify({ casco, sensor, valores, etc. })

  @column()
  declare deliveryChannels: string // JSON array: ['database', 'email', 'push']

  @column()
  declare read: boolean

  @column()
  declare isRead: boolean // Alias para read

  @column()
  declare isError: boolean

  @column()
  declare emailSent: boolean

  @column()
  declare pushSent: boolean

  @column.dateTime()
  declare fechaEnvio: DateTime

  @column.dateTime()
  declare fechaLeido: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare usuario: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Métodos helper
  public shouldSendEmail(): boolean {
    const channels = JSON.parse(this.deliveryChannels || '[]')
    return channels.includes('email')
  }

  public shouldSendPush(): boolean {
    const channels = JSON.parse(this.deliveryChannels || '[]')
    return channels.includes('push')
  }

  // Métodos para trabajar con data JSON
  public setData(data: any): void {
    this.data = JSON.stringify(data)
  }

  public getData(): any {
    return this.data ? JSON.parse(this.data) : null
  }

  public getDeliveryChannels(): string[] {
    try {
      return JSON.parse(this.deliveryChannels)
    } catch {
      return ['database']
    }
  }

  public setDeliveryChannels(channels: string[]): void {
    this.deliveryChannels = JSON.stringify(channels)
  }
}
