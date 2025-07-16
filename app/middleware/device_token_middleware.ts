import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware para validar tokens de dispositivos IoT
 */
export default class DeviceTokenMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const deviceToken = ctx.request.header('x-device-token')
    
    if (!deviceToken) {
      return ctx.response.status(401).json({
        success: false,
        message: 'Token de dispositivo requerido'
      })
    }

    // Validación básica del token
    if (deviceToken.length < 10) {
      return ctx.response.status(401).json({
        success: false,
        message: 'Token de dispositivo inválido'
      })
    }

    // TODO: Implementar validación más robusta
    // - Verificar token en base de datos
    // - Verificar permisos del dispositivo
    // - Verificar si el dispositivo está activo

    await next()
  }
}
