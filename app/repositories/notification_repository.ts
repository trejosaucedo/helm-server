import Notification from '#models/notification'
import type { CreateNotificationDto, NotificationFiltersDto } from '#dtos/notification.dto'

export class NotificationRepository {
  
  async create(data: CreateNotificationDto): Promise<Notification> {
    return await Notification.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || 'normal',
      isRead: false,
      data: data.data ? JSON.stringify(data.data) : null,
    })
  }

  async findById(id: string): Promise<Notification | null> {
    return await Notification.find(id)
  }

  async findByUserId(
    userId: string, 
    filters: NotificationFiltersDto = {}
  ): Promise<Notification[]> {
    const query = Notification.query().where('userId', userId)

    if (filters.type) {
      query.where('type', filters.type)
    }

    if (filters.isRead !== undefined) {
      query.where('isRead', filters.isRead)
    }

    query.orderBy('createdAt', 'desc')

    if (filters.limit) {
      query.limit(filters.limit)
    }

    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit
      query.offset(offset)
    }

    return await query
  }

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const notification = await Notification.query()
      .where('id', id)
      .where('userId', userId)
      .first()

    if (!notification) return false

    notification.isRead = true
    await notification.save()
    return true
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.query()
      .where('userId', userId)
      .where('isRead', false)
      .update({ isRead: true })

    return result[0]
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const notification = await Notification.query()
      .where('id', id)
      .where('userId', userId)
      .first()

    if (!notification) return false

    await notification.delete()
    return true
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await Notification.query()
      .where('userId', userId)
      .where('isRead', false)
      .count('* as total')
      .then(result => result[0].$extras.total)
  }

  async bulkCreate(notifications: CreateNotificationDto[]): Promise<Notification[]> {
    const data = notifications.map(notif => ({
      userId: notif.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      priority: notif.priority || 'normal',
      isRead: false,
      data: notif.data ? JSON.stringify(notif.data) : null,
    }))

    return await Notification.createMany(data)
  }
}
