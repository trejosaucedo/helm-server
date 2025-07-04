import { NotificationRepository, CreateNotificationAttrs } from '#repositories/notification_repository'
import Notification from '#models/notification'
import { EmailService } from '#services/email_service'
import { PushService } from '#services/push_service'

export interface CreateNotificationDTO extends CreateNotificationAttrs {}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'

export class NotificationService {
  private repo = new NotificationRepository()
  private emailService = new EmailService()
  private pushService = new PushService()

  /**
   * Crea una notificación en BD y la entrega por los canales configurados.
   */
  public async sendNotification(attrs: CreateNotificationDTO): Promise<Notification> {
    // 1. Crear en BD
    const notification = await this.repo.createNotification(attrs)

    // 2. Orquestar envío por email/push según flags
    await this.processDeliveryChannels(notification)

    return notification
  }

  /**
   * Crea varias notificaciones (bulk) y procesa sus canales de entrega.
   */
  public async sendBulkNotifications(
    notifications: CreateNotificationDTO[]
  ): Promise<Notification[]> {
    // 1. Bulk insert en BD
    const created = await this.repo.bulkCreateNotifications(notifications)

    // 2. Orquestar envío para cada una
    await Promise.all(created.map((n) => this.processDeliveryChannels(n)))

    return created
  }

  /**
   * Interno: envía email y/o push según corresponda y marca el delivery en BD.
   */
  private async processDeliveryChannels(notification: Notification): Promise<void> {
    // Email
    if (notification.shouldSendEmail()) {
      try {
        await this.emailService.sendNotificationEmail(notification)
        await this.repo.updateDeliveryStatus(notification.id, 'email', true)
      } catch (err) {
        console.error('Error enviando email:', err)
      }
    }

    // Push
    if (notification.shouldSendPush()) {
      try {
        await this.pushService.sendNotificationPush(notification)
        await this.repo.updateDeliveryStatus(notification.id, 'push', true)
      } catch (err) {
        console.error('Error enviando push:', err)
      }
    }
  }

  /**
   * Permite a un supervisor enviar un mensaje a múltiples usuarios.
   */
  public async sendSupervisorMessage(
    userIds: string[],
    title: string,
    message: string,
    data?: Record<string, any>,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<Notification[]> {
    const payloads: CreateNotificationDTO[] = userIds.map((userId) => ({
      userId,
      type: 'supervisor',
      title,
      message,
      priority,
      deliveryChannels: ['database', 'push', 'email'],
      data: { ...data, timestamp: new Date().toISOString() },
    }))

    return this.sendBulkNotifications(payloads)
  }


  // Métodos de lectura / estado


  public async getUserNotifications(
    userId: string,
    options?: { page?: number; limit?: number },
    filters?: any
  ) {
    return this.repo.listByUser(userId, options, filters)
  }

  public async getUnreadCount(userId: string): Promise<number> {
    return this.repo.countUnread(userId)
  }

  public async getNotificationStats(userId: string) {
    return this.repo.getStats(userId)
  }


  // Métodos de marcado / borrado


  public async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.repo.markAsRead(notificationId, userId)
  }

  public async markAllAsRead(userId: string): Promise<void> {
    await this.repo.markAllAsRead(userId)
  }

  /**
   * Marca notificación como errónea (feedback usuario) y notifica al admin.
   */
  public async markAsError(
  notificationId: string,
  userId: string,
  comment?: string
): Promise<void> {
  // 1. Registrar el error en BD
  await this.repo.markAsError(notificationId, userId, comment)

  // 2. Recuperar la notificación para el reporte
  const notification = await this.repo.findById(notificationId)

  // 3. Validar que exista
  if (!notification) {
    throw new Error(`Notification with id ${notificationId} not found`)
  }

  // 4. Avisar al admin por email
  try {
    await this.emailService.sendErrorReportNotification(
      ADMIN_EMAIL,
      userId,
      notification,
      comment
    )
  } catch (err) {
    console.error('Error enviando reporte de notificación errónea:', err)
  }
}

  public async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.repo.delete(notificationId, userId)
  }

  public async clearReadNotifications(userId: string): Promise<void> {
    await this.repo.deleteReadNotifications(userId)
  }

  /**
   * Genera una alerta automática cuando un sensor sale de su rango seguro.
   */
  public async createSensorAlert(
    userId: string,
    sensorType: string,
    value: number,
    threshold: number,
    unit: string
  ): Promise<Notification> {
    const priority = this.calculateSensorPriority(sensorType, value, threshold)

    return this.sendNotification({
      userId,
      type: 'sensor',
      title: `Alerta de ${sensorType}`,
      message: `El sensor ${sensorType} registró ${value}${unit}, fuera del rango seguro (${threshold}${unit})`,
      priority,
      deliveryChannels: ['database', 'push', ...(priority === 'critical' ? ['email'] : [])],
      data: { sensorType, value, threshold, unit, timestamp: new Date().toISOString() },
    })
  }

  private calculateSensorPriority(
    sensorType: string,
    value: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const factor = sensorType === 'accelerometer' ? 0.2 : 0.1
    const deviation = Math.abs(value - threshold) / threshold

    if (deviation > 0.5 + factor) return 'critical'
    if (deviation > 0.3 + factor) return 'high'
    if (deviation > 0.1 + factor) return 'medium'
    return 'low'
  }


  // Procesamiento batch (scheduler)


  /**
   * Procesa notificaciones pendientes de email y push (invocado desde un Job).
   */
  public async processPendingNotifications(): Promise<void> {
    // Emails pendientes
    const pendingEmails = await this.repo.getPendingEmailNotifications()
    await Promise.all(
      pendingEmails.map(async (notif) => {
        try {
          await this.emailService.sendNotificationEmail(notif)
          await this.repo.updateDeliveryStatus(notif.id, 'email', true)
        } catch (err) {
          console.error('Error procesando email pendiente:', err)
        }
      })
    )

    // Push pendientes
    const pendingPush = await this.repo.getPendingPushNotifications()
    await Promise.all(
      pendingPush.map(async (notif) => {
        try {
          await this.pushService.sendNotificationPush(notif)
          await this.repo.updateDeliveryStatus(notif.id, 'push', true)
        } catch (err) {
          console.error('Error procesando push pendiente:', err)
        }
      })
    )
  }
}
