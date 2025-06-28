// app/middleware/auth_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { TokenUtils } from '#utils/token_utils'
import User from '#models/user'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const token = TokenUtils.extractFromContext(ctx)

    if (!token) {
      return ctx.response.status(401).json({
        success: false,
        message: 'Token de autenticación requerido',
        data: null,
      })
    }

    const validation = await User.validateToken(token)

    if (!validation) {
      return ctx.response.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        data: null,
      })
    }

    // Agregar user y tokenData al contexto para uso posterior
    ctx.user = validation.user
    ctx.tokenData = validation.tokenData

    return next()
  }
}
