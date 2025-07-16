import { DateTime } from 'luxon'
import Notification from '#models/notification'

export interface CreateNotificationAttrs {
  userId: string
  type: 'general' | 'sensor' | 'supervisor'
  title: string
  message: string
  data?: any
  priority?: 'low' | 'medium' | 'high' | 'critical'
  deliveryChannels?: string[]
}

export interface NotificationFilters {
  type?: 'general' | 'sensor' | 'supervisor'
  isRead?: boolean
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export class NotificationRepository {
  public async createNotification(attrs: CreateNotificationAttrs): Promise<Notification> {
    const notification = new Notification()
    notification.userId = attrs.userId
    notification.type = attrs.type
    notification.title = attrs.title
    notification.message = attrs.message
    notification.priority = attrs.priority || 'medium'
    notification.setDeliveryChannels(attrs.deliveryChannels || ['database'])
    notification.isError = false
    notification.emailSent = false
    notification.pushSent = false

    if (attrs.data !== undefined) {
      notification.setData(attrs.data)
    }

    await notification.save()
    return notification
  }

  public async bulkCreateNotifications(
    notifications: CreateNotificationAttrs[]
  ): Promise<Notification[]> {
    const createdNotifications: Notification[] = []

    for (const attrs of notifications) {
      const notification = await this.createNotification(attrs)
      createdNotifications.push(notification)
    }

    return createdNotifications
  }

  public async listByUser(
    userId: string,
    options: { page?: number; limit?: number } = {},
    filters: NotificationFilters = {}
  ) {
    const page = options.page ?? 1
    const limit = options.limit ?? 20

    let query = Notification.query().where('user_id', userId)

    // Aplicar filtros
    if (filters.type) {
      query = query.where('type', filters.type)
    }

    if (filters.isRead !== undefined) {
      query = query.where('is_read', filters.isRead)
    }

    if (filters.priority) {
      query = query.where('priority', filters.priority)
    }

    return query.orderBy('created_at', 'desc').paginate(page, limit)
  }

  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.query().where('id', notificationId).where('user_id', userId).update({
      is_read: true,
      read_at: DateTime.local(),
      updated_at: DateTime.local(),
    })
  }

  public async markAllAsRead(userId: string): Promise<void> {
    await Notification.query().where('user_id', userId).where('is_read', false).update({
      is_read: true,
      read_at: DateTime.local(),
      updated_at: DateTime.local(),
    })
  }

  public async countUnread(userId: string): Promise<number> {
    const result = await Notification.query()
      .where('user_id', userId)
      .andWhere('is_read', false)
      .count('id as total')

    return Number(result[0].$extras.total)
  }

  public async getStats(userId: string) {
    const stats = await Notification.query()
      .where('user_id', userId)
      .select('type', 'priority', 'is_read', 'is_error')
      .exec()

    return {
      total: stats.length,
      unread: stats.filter((n) => !n.isRead).length,
      byType: {
        general: stats.filter((n) => n.type === 'general').length,
        sensor: stats.filter((n) => n.type === 'sensor').length,
        supervisor: stats.filter((n) => n.type === 'supervisor').length,
      },
      byPriority: {
        low: stats.filter((n) => n.priority === 'low').length,
        medium: stats.filter((n) => n.priority === 'medium').length,
        high: stats.filter((n) => n.priority === 'high').length,
        critical: stats.filter((n) => n.priority === 'critical').length,
      },
      errors: stats.filter((n) => n.isError).length,
    }
  }

  public async findById(id: string): Promise<Notification | null> {
    return Notification.find(id)
  }

  public async findByIdAndUser(id: string, userId: string): Promise<Notification | null> {
    return Notification.query().where('id', id).where('user_id', userId).first()
  }

  public async delete(id: string, userId: string): Promise<void> {
    await Notification.query().where('id', id).where('user_id', userId).delete()
  }

  public async deleteReadNotifications(userId: string): Promise<void> {
    await Notification.query().where('user_id', userId).andWhere('is_read', true).delete()
  }

  public async updateDeliveryStatus(
    id: string,
    channel: 'email' | 'push',
    sent: boolean
  ): Promise<void> {
    const updateData: any = { updated_at: DateTime.local() }

    if (channel === 'email') {
      updateData.email_sent = sent
    } else if (channel === 'push') {
      updateData.push_sent = sent
    }

    await Notification.query().where('id', id).update(updateData)
  }

  public async getPendingEmailNotifications(): Promise<Notification[]> {
    return Notification.query()
      .where('email_sent', false)
      .whereIn('priority', ['high', 'critical'])
      .whereRaw('JSON_CONTAINS(delivery_channels, \'"email"\')')
      .preload('user')
      .exec()
  }

  public async getPendingPushNotifications(): Promise<Notification[]> {
    return Notification.query()
      .where('push_sent', false)
      .whereIn('priority', ['medium', 'high', 'critical'])
      .whereRaw('JSON_CONTAINS(delivery_channels, \'"push"\')')
      .preload('user')
      .exec()
  }
}
