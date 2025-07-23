import type { HttpContext } from '@adonisjs/core/http'
import { NotificationService } from '#services/notification_service'
import { ErrorHandler } from '#utils/error_handler'

export default class NotificationController {
  private service: NotificationService

  constructor() {
    this.service = new NotificationService()
  }

  /**
   * GET /notifications - Obtener notificaciones del usuario
   */
  async index({ request, response, user }: HttpContext) {
    try {
      if (!user) {
        return response.status(401).json({ success: false, message: 'No autenticado' })
      }

      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      const type = request.input('type')
      const isRead = request.input('isRead')

      const notifications = await this.service.getUserNotifications(user.id, {
        page,
        limit,
        type,
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
      })

      return response.json({
        success: true,
        message: 'Notificaciones obtenidas exitosamente',
        data: notifications,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'NOTIFICATION_INDEX')
      return response.status(500).json({
        success: false,
        message: 'Error al obtener notificaciones',
      })
    }
  }

  /**
   * GET /notifications/unread-count - Conteo de no leídas
   */
  async unreadCount({ response, user }: HttpContext) {
    try {
      if (!user) {
        return response.status(401).json({ success: false, message: 'No autenticado' })
      }

      const count = await this.service.getUnreadCount(user.id)

      return response.json({
        success: true,
        data: { count },
      })
    } catch (error) {
      ErrorHandler.logError(error, 'NOTIFICATION_UNREAD_COUNT')
      return response.status(500).json({
        success: false,
        message: 'Error al obtener conteo',
      })
    }
  }

  /**
   * POST /notifications/:id/read - Marcar como leída
   */
  async markAsRead({ params, response, user }: HttpContext) {
    try {
      if (!user) {
        return response.status(401).json({ success: false, message: 'No autenticado' })
      }

      const success = await this.service.markAsRead(params.id, user.id)

      if (!success) {
        return response.status(404).json({
          success: false,
          message: 'Notificación no encontrada',
        })
      }

      return response.json({
        success: true,
        message: 'Notificación marcada como leída',
      })
    } catch (error) {
      ErrorHandler.logError(error, 'NOTIFICATION_MARK_READ')
      return response.status(500).json({
        success: false,
        message: 'Error al marcar notificación',
      })
    }
  }

  /**
   * POST /notifications/read-all - Marcar todas como leídas
   */
  async markAllAsRead({ response, user }: HttpContext) {
    try {
      if (!user) {
        return response.status(401).json({ success: false, message: 'No autenticado' })
      }

      const count = await this.service.markAllAsRead(user.id)

      return response.json({
        success: true,
        message: `${count} notificaciones marcadas como leídas`,
        data: { count },
      })
    } catch (error) {
      ErrorHandler.logError(error, 'NOTIFICATION_MARK_ALL_READ')
      return response.status(500).json({
        success: false,
        message: 'Error al marcar notificaciones',
      })
    }
  }

  /**
   * DELETE /notifications/:id - Eliminar notificación
   */
  async delete({ params, response, user }: HttpContext) {
    try {
      if (!user) {
        return response.status(401).json({ success: false, message: 'No autenticado' })
      }

      const success = await this.service.delete(params.id, user.id)

      if (!success) {
        return response.status(404).json({
          success: false,
          message: 'Notificación no encontrada',
        })
      }

      return response.json({
        success: true,
        message: 'Notificación eliminada',
      })
    } catch (error) {
      ErrorHandler.logError(error, 'NOTIFICATION_DELETE')
      return response.status(500).json({
        success: false,
        message: 'Error al eliminar notificación',
      })
    }
  }

  /**
   * POST /notifications/supervisor-message - Enviar mensaje masivo (solo supervisores)
   */
  async sendSupervisorMessage({ request, response, user }: HttpContext) {
    try {
      if (!user || !['supervisor', 'admin'].includes(user.role)) {
        return response.status(403).json({
          success: false,
          message: 'Solo supervisores pueden enviar mensajes masivos',
        })
      }

      const { userIds, title, message } = request.body()

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return response.status(400).json({
          success: false,
          message: 'userIds es requerido y debe ser un array con al menos un ID',
        })
      }

      if (!title || !message) {
        return response.status(400).json({
          success: false,
          message: 'title y message son requeridos',
        })
      }

      const notifications = await this.service.sendSupervisorMessage({
        userIds,
        title,
        message,
        supervisorName: user.fullName || user.email,
      })

      return response.status(201).json({
        success: true,
        message: `Mensaje enviado a ${notifications.length} usuarios`,
        data: notifications,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'NOTIFICATION_SUPERVISOR_MESSAGE')
      return response.status(500).json({
        success: false,
        message: 'Error al enviar mensaje',
      })
    }
  }
}
