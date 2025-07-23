import { NotificationRepository } from '#repositories/notification_repository'
import type { 
  CreateNotificationDto, 
  NotificationResponseDto, 
  NotificationFiltersDto 
} from '#dtos/notification.dto'
// @ts-ignore
import { wsService } from '#start/ws'

export class NotificationService {
  private repository: NotificationRepository

  constructor() {
    this.repository = new NotificationRepository()
  }

  /**
   * Crea una notificación y decide por qué canales enviarla
   */
  async create(data: CreateNotificationDto): Promise<NotificationResponseDto> {
    // 1. Guardar en base de datos
    const notification = await this.repository.create(data)

    // 2. Decidir canales según tipo y prioridad
    await this.sendToChannels(notification)

    return this.toResponseDto(notification)
  }

  /**
   * Crear múltiples notificaciones (para supervisores que envían mensajes masivos)
   */
  async createBulk(notifications: CreateNotificationDto[]): Promise<NotificationResponseDto[]> {
    const created = await this.repository.bulkCreate(notifications)
    
    // Enviar por canales correspondientes
    for (const notification of created) {
      await this.sendToChannels(notification)
    }

    return created.map(notif => this.toResponseDto(notif))
  }

  /**
   * Obtener notificaciones de un usuario con filtros
   */
  async getUserNotifications(
    userId: string, 
    filters: NotificationFiltersDto = {}
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.repository.findByUserId(userId, filters)
    return notifications.map(notif => this.toResponseDto(notif))
  }

  /**
   * Marcar como leída
   */
  async markAsRead(id: string, userId: string): Promise<boolean> {
    return await this.repository.markAsRead(id, userId)
  }

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(userId: string): Promise<number> {
    return await this.repository.markAllAsRead(userId)
  }

  /**
   * Eliminar notificación
   */
  async delete(id: string, userId: string): Promise<boolean> {
    return await this.repository.delete(id, userId)
  }

  /**
   * Obtener conteo de no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.repository.getUnreadCount(userId)
  }

  /**
   * MÉTODOS ESPECÍFICOS DEL DOMINIO
   */

  /**
   * Crear alerta de sensor crítica
   */
  async createSensorAlert(data: {
    userId: string
    sensorType: string
    sensorName: string
    value: number
    unit: string
    threshold: number
    cascoId: string
    location?: string
  }): Promise<NotificationResponseDto> {
    return await this.create({
      userId: data.userId,
      type: 'sensor_alert',
      title: `🚨 Alerta: ${data.sensorName}`,
      message: `Valor crítico detectado: ${data.value}${data.unit} (umbral: ${data.threshold}${data.unit})`,
      priority: 'normal',
      data: {
        sensorType: data.sensorType,
        sensorName: data.sensorName,
        value: data.value,
        unit: data.unit,
        threshold: data.threshold,
        cascoId: data.cascoId,
        location: data.location,
        timestamp: new Date().toISOString(),
      }
    })
  }

  /**
   * Enviar mensaje de supervisor a mineros
   */
  async sendSupervisorMessage(data: {
    userIds: string[]
    title: string
    message: string
    supervisorName: string
  }): Promise<NotificationResponseDto[]> {
    const notifications = data.userIds.map(userId => ({
      userId,
      type: 'supervisor_message' as const,
      title: data.title,
      message: data.message,
      priority: 'normal',
      data: {
        supervisorName: data.supervisorName,
        timestamp: new Date().toISOString(),
      }
    }))

    return await this.createBulk(notifications)
  }

  /**
   * Notificación del sistema
   */
  async createSystemNotification(data: {
    userId: string
    title: string
    message: string
    priority?: string
    data?: any
  }): Promise<NotificationResponseDto> {
    return await this.create({
      userId: data.userId,
      type: 'system',
      title: data.title,
      message: data.message,
      priority: data.priority || 'normal',
      data: data.data
    })
  }

  /**
   * MÉTODOS PRIVADOS
   */

  private async sendToChannels(notification: any): Promise<void> {
    // 1. WebSocket en tiempo real (siempre)
    await this.sendWebSocket(notification)

    // 2. Email para todas las notificaciones
    await this.sendEmail(notification)

    // 3. Push notification para todas las notificaciones
    await this.sendPush(notification)
  }

  private async sendWebSocket(notification: any): Promise<void> {
    try {
      if (wsService) {
        wsService.emitNotification(notification.userId, {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          data: notification.getData(),
          createdAt: notification.createdAt.toISO(),
        })
      }
    } catch (error) {
      console.error('Error enviando WebSocket:', error)
    }
  }

  private async sendEmail(notification: any): Promise<void> {
    try {
      // TODO: Implementar envío de email real
      console.log(`📧 Email enviado: ${notification.title} → ${notification.userId}`)
      // Aquí irías APIs como SendGrid, Nodemailer, etc.
    } catch (error) {
      console.error('Error enviando email:', error)
    }
  }

  private async sendPush(notification: any): Promise<void> {
    try {
      // TODO: Implementar push notification real
      console.log(`📱 Push notification enviado: ${notification.title} → ${notification.userId}`)
      // Aquí irían APIs como Firebase, OneSignal, etc.
    } catch (error) {
      console.error('Error enviando push:', error)
    }
  }

  private toResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      isRead: notification.isRead,
      data: notification.getData(),
      createdAt: notification.createdAt.toISO(),
      updatedAt: notification.updatedAt?.toISO() || null,
    }
  }
}
