import { TokenUtils } from '#utils/token_utils'
import { AuthService } from '#services/auth_service'
import type { HttpContext } from '@adonisjs/core/http'

const authService = new AuthService()

export function withUser(handler: (user: any, ctx: HttpContext) => Promise<any>) {
  return async (ctx: HttpContext) => {
    const tokenValidation = TokenUtils.validateAccessTokenPresence(ctx.request)
    if (!tokenValidation.isValid) {
      TokenUtils.unauthorizedResponse(ctx.response, 'Token requerido')
      return
    }
    const validation = await authService.validateAccessToken(tokenValidation.token!)
    if (!validation) {
      TokenUtils.unauthorizedResponse(ctx.response, 'Token inválido')
      return
    }
    return handler(validation.user, ctx)
  }
}

export function withSession(
  handler: (user: any, sessionId: string, ctx: HttpContext) => Promise<any>
) {
  return async (ctx: HttpContext) => {
    const sessionValidation = TokenUtils.validateSessionIdPresence(ctx.request)
    if (!sessionValidation.isValid) {
      TokenUtils.unauthorizedResponse(ctx.response, 'Sesión requerida')
      return
    }
    const user = await authService.validateSession(sessionValidation.sessionId!)
    if (!user) {
      TokenUtils.unauthorizedResponse(ctx.response, 'Sesión inválida')
      return
    }
    return handler(user, sessionValidation.sessionId!, ctx)
  }
}
