import vine from '@vinejs/vine'

/**
 * Validator para crear notificaciones
 */
export const createNotificationValidator = vine.compile(
  vine.object({
    userId: vine.string().uuid(),
    type: vine.enum(['general', 'sensor', 'supervisor']),
    title: vine.string().minLength(1).maxLength(255),
    message: vine.string().minLength(1).maxLength(1000),
    priority: vine.enum(['low', 'medium', 'high', 'critical']).optional(),
    deliveryChannels: vine.array(vine.enum(['database', 'email', 'push'])).optional(),
    data: vine.any().optional(),
  })
)

/**
 * Validator para creación masiva
 */
export const bulkCreateValidator = vine.compile(
  vine.object({
    notifications: vine
      .array(
        vine.object({
          userId: vine.string().uuid(),
          type: vine.enum(['general', 'sensor', 'supervisor']),
          title: vine.string().minLength(1).maxLength(255),
          message: vine.string().minLength(1).maxLength(1000),
          priority: vine.enum(['low', 'medium', 'high', 'critical']).optional(),
          deliveryChannels: vine.array(vine.enum(['database', 'email', 'push'])).optional(),
          data: vine.any().optional(),
        })
      )
      .minLength(1)
      .maxLength(100),
  })
)

/**
 * Validator para paginación con filtros
 */
export const paginationValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().min(1).optional(),
    limit: vine.number().withoutDecimals().min(1).max(100).optional(),
    type: vine.enum(['general', 'sensor', 'supervisor']).optional(),
    isRead: vine.boolean().optional(),
    priority: vine.enum(['low', 'medium', 'high', 'critical']).optional(),
  })
)

/**
 * Validator para parámetros de ID
 */
export const idParamsValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
  })
)

/**
 * Validator para marcar como error
 */
export const markAsErrorValidator = vine.compile(
  vine.object({
    comment: vine.string().minLength(1).maxLength(500).optional(),
  })
)
