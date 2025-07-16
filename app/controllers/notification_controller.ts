import type { HttpContext } from '@adonisjs/core/http'
import { NotificationService } from '#services/notification_service'
import {
  paginationValidator,
  idParamsValidator,
  bulkCreateValidator,
} from '#validators/notification'

export default class NotificationController {
  private service = new NotificationService()

  /**
   * GET /notifications
   * Lista notificaciones del usuario autenticado (paginado)
   */
  public async index({ request, response, auth }: HttpContext & { auth: any }) {
    const userId = auth.user!.id
    const { page = 1, limit = 20, type, isRead } = await request.validateUsing(paginationValidator)

    const filters = {
      type: type || undefined,
      isRead: isRead !== undefined ? isRead : undefined,
    }

    const notifications = await this.service.getUserNotifications(userId, { page, limit }, filters)

    return response.ok({
      success: true,
      data: notifications,
    })
  }

  /**
   * POST /notifications/bulk
   * Crea múltiples notificaciones (solo admin/supervisor)
   */
  public async bulkStore({ request, response, auth }: HttpContext & { auth: any }) {
    const user = auth.user!

    if (!['admin', 'supervisor'].includes(user.role)) {
      return response.forbidden({
        success: false,
        message: 'Solo administradores y supervisores pueden crear notificaciones',
      })
    }

    const { notifications } = await request.validateUsing(bulkCreateValidator)

    const createdNotifications = await this.service.sendBulkNotifications(notifications)

    return response.created({
      success: true,
      data: createdNotifications,
    })
  }

  /**
   * POST /notifications/:id/read
   * Marca una notificación como leída
   */
  public async markRead({ params, response, auth }: HttpContext & { auth: any }) {
    const { id } = await params.validateUsing(idParamsValidator)
    const userId = auth.user!.id

    await this.service.markAsRead(id, userId)

    return response.ok({
      success: true,
    })
  }

  /**
   * POST /notifications/read-all
   * Marca todas las notificaciones del usuario autenticado como leídas
   */
  public async markAllRead({ auth, response }: HttpContext & { auth: any }) {
    const userId = auth.user!.id

    await this.service.markAllAsRead(userId)

    return response.ok({
      success: true,
    })
  }

  /**
   * DELETE /notifications/:id
   * Elimina una notificación por ID
   */
  public async destroy({ params, response, auth }: HttpContext & { auth: any }) {
    const { id } = await params.validateUsing(idParamsValidator)
    const userId = auth.user!.id

    await this.service.deleteNotification(id, userId)

    return response.noContent()
  }

  /**
   * DELETE /notifications/clear
   * Elimina todas las notificaciones leídas del usuario autenticado
   */
  public async clearRead({ auth, response }: HttpContext & { auth: any }) {
    const userId = auth.user!.id

    await this.service.clearReadNotifications(userId)

    return response.noContent()
  }

  /**
   * GET /notifications/count
   * Obtiene el conteo de notificaciones no leídas
   */
  public async unreadCount({ auth, response }: HttpContext & { auth: any }) {
    const userId = auth.user!.id

    const count = await this.service.getUnreadCount(userId)

    return response.ok({
      success: true,
      data: { unreadCount: count },
    })
  }

  /**
   * GET /notifications/stats
   * Obtiene estadísticas de notificaciones
   */
  public async stats({ auth, response }: HttpContext & { auth: any }) {
    const userId = auth.user!.id

    const stats = await this.service.getNotificationStats(userId)

    return response.ok({
      success: true,
      data: stats,
    })
  }
}
