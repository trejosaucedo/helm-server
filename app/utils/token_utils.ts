import type { HttpContext } from '@adonisjs/core/http'

export class TokenUtils {
  private static getBaseCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production'
    const sameSite = (isProd ? 'none' : 'lax') as 'none' | 'lax' | 'strict'
    const secure = isProd ? true : false
    const base: any = {
      httpOnly: true,
      secure,
      sameSite,
    }
    const domain = process.env.COOKIE_DOMAIN
    if (domain && typeof domain === 'string' && domain.trim().length > 0) {
      base.domain = domain.trim()
    }
    return base
  }

  static setSessionCookie(response: HttpContext['response'], sessionId: string) {
    response.cookie('sessionId', sessionId, {
      ...this.getBaseCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  }

  static setAccessTokenCookie(response: HttpContext['response'], accessToken: string) {
    response.cookie('accessToken', accessToken, {
      ...this.getBaseCookieOptions(),
      maxAge: 15 * 60 * 1000,
    })
  }

  static setAuthCookies(response: HttpContext['response'], sessionId: string, accessToken: string) {
    this.setSessionCookie(response, sessionId)
    this.setAccessTokenCookie(response, accessToken)
  }

  static clearAuthCookies(response: HttpContext['response']) {
    response.clearCookie('sessionId')
    response.clearCookie('accessToken')
  }

  static getAccessTokenFromCookies(request: HttpContext['request']): string | undefined {
    return request.cookie('accessToken')
  }

  static getSessionIdFromCookies(request: HttpContext['request']): string | undefined {
    return request.cookie('sessionId')
  }

  static validateAccessTokenPresence(request: HttpContext['request']): {
    isValid: boolean
    token?: string
  } {
    const token = this.getAccessTokenFromCookies(request)
    return {
      isValid: !!token,
      token,
    }
  }

  static validateSessionIdPresence(request: HttpContext['request']): {
    isValid: boolean
    sessionId?: string
  } {
    const sessionId = this.getSessionIdFromCookies(request)
    return {
      isValid: !!sessionId,
      sessionId,
    }
  }

  static formatUserData(user: any) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      cascoId: user.cascoId,
      createdAt: user.createdAt.toISO(),
      updatedAt: user.updatedAt?.toISO() || null,
    }
  }

  static unauthorizedResponse(
    response: HttpContext['response'],
    message: string = 'Token requerido'
  ) {
    return response.status(401).json({
      success: false,
      message,
      data: null,
    })
  }

  static forbiddenResponse(response: HttpContext['response'], message: string = 'Acceso denegado') {
    return response.status(403).json({
      success: false,
      message,
      data: null,
    })
  }

  static successResponse(
    response: HttpContext['response'],
    message: string,
    data: any = null,
    status: number = 200
  ) {
    return response.status(status).json({
      success: true,
      message,
      data,
    })
  }

  static formatAuthResponse(user: any, token: any) {
    return {
      user: this.formatUserData(user),
      accessToken: token.accessToken || token.token,
      sessionId: token.sessionId,
    }
  }

  static extractFromContext(ctx: HttpContext): string | undefined {
    // Priorizar header Authorization (Bearer) sobre cookie para evitar usar tokens viejos
    const authHeader = ctx.request.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7)
    }
    const token = ctx.request.cookie('accessToken')
    if (token) return token
    return undefined
  }
}