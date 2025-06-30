import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { TokenUtils } from '#utils/token_utils'
import User from '#models/user'

export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    let token = TokenUtils.getAccessTokenFromCookies(ctx.request)
    let validation = token ? await User.validateAccessToken(token) : null

    if (!validation) {
      const sessionId = TokenUtils.getSessionIdFromCookies(ctx.request)

      if (sessionId) {
        const newAccessToken = await User.refreshAccessToken(sessionId)

        if (newAccessToken) {
          TokenUtils.setAccessTokenCookie(ctx.response, newAccessToken)

          validation = await User.validateAccessToken(newAccessToken)
        }
      }
    }

    if (!validation) {
      return TokenUtils.unauthorizedResponse(ctx.response, 'Token inválido o expirado')
    }

    ctx.user = validation.user
    ctx.tokenData = validation.tokenData

    return next()
  }
}
