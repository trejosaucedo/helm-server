import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { TokenUtils } from '#utils/token_utils'
import { SessionService } from '#services/session_service'
import { toUserResponseDto } from '../mappers/user.mapper.js'

export default class IsAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Validación de token
    const token = TokenUtils.extractFromContext(ctx)
    const validation = token ? await SessionService.validateAccessToken(token) : null

    if (!validation) {
      return TokenUtils.unauthorizedResponse(ctx.response, 'Debe iniciar sesión para acceder a este recurso')
    }

    const user = validation.user

    if (user.role !== 'admin') {
      return TokenUtils.forbiddenResponse(ctx.response, 'No tiene permisos para acceder a este recurso')
    }

    ctx.user = toUserResponseDto(user)
    ctx.tokenData = validation.tokenData

    await next()
  }
}
