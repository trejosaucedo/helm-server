import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const token = this.extractToken(ctx)

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

    return next()
  }

  private extractToken(ctx: HttpContext): string | null {
    const authHeader = ctx.request.header('authorization')

    if (!authHeader) {
      return null
    }

    if (!authHeader.startsWith('Bearer ')) {
      return null
    }

    return authHeader.slice(7) // Remove 'Bearer ' prefix
  }
}
