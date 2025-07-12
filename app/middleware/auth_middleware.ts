import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { TokenUtils } from '#utils/token_utils'
import { SessionService } from '#services/session_service'
import { toUserResponseDto } from '../mappers/user.mapper.js'

export default class AuthMiddleware {
  public async handle(ctx: HttpContext, next: NextFn, guards?: string | string[]) {
    // 1. Validación de token
    const token = TokenUtils.extractFromContext(ctx)
    let validation = token ? await SessionService.validateAccessToken(token) : null

    // 2. Intentar refresh si no es válido
    if (!validation) {
      const sessionId = TokenUtils.getSessionIdFromCookies(ctx.request)
      if (sessionId && (await SessionService.sessionExists(sessionId))) {
        const newAccessToken = await SessionService.refreshAccessToken(sessionId)
        if (newAccessToken) {
          TokenUtils.setAccessTokenCookie(ctx.response, newAccessToken)
          validation = await SessionService.validateAccessToken(newAccessToken)
        }
      }
    }

    if (!validation) {
      return TokenUtils.unauthorizedResponse(ctx.response, 'Token inválido o expirado')
    }

    const user = validation.user

    // --- AUTORIZACIÓN POR ROL ---
    let allowedRoles: string[] = []

    if (guards) {
      if (typeof guards === 'string') {
        allowedRoles = [guards]
      } else if (Array.isArray(guards)) {
        allowedRoles = guards
      }
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return TokenUtils.forbiddenResponse(ctx.response, 'No tienes acceso a esta sección')
    }

    ctx.user = toUserResponseDto(user)
    ctx.tokenData = validation.tokenData

    return next()
  }
}
