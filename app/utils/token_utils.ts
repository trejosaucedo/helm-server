import type { HttpContext } from '@adonisjs/core/http'

export class TokenUtils {
  // Configuración base para cookies seguras
  private static getBaseCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
    }
  }

  // Configurar cookie de sesión
  static setSessionCookie(response: HttpContext['response'], sessionId: string) {
    response.cookie('sessionId', sessionId, {
      ...this.getBaseCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    })
  }

  // Configurar cookie de access token
  static setAccessTokenCookie(response: HttpContext['response'], accessToken: string) {
    response.cookie('accessToken', accessToken, {
      ...this.getBaseCookieOptions(),
      maxAge: 15 * 60 * 1000, // 15 minutos
    })
  }

  // Configurar ambas cookies de autenticación
  static setAuthCookies(response: HttpContext['response'], sessionId: string, accessToken: string) {
    this.setSessionCookie(response, sessionId)
    this.setAccessTokenCookie(response, accessToken)
  }

  // Limpiar todas las cookies de autenticación
  static clearAuthCookies(response: HttpContext['response']) {
    response.clearCookie('sessionId')
    response.clearCookie('accessToken')
  }

  // Obtener access token de las cookies
  static getAccessTokenFromCookies(request: HttpContext['request']): string | undefined {
    return request.cookie('accessToken')
  }

  // Obtener session ID de las cookies
  static getSessionIdFromCookies(request: HttpContext['request']): string | undefined {
    return request.cookie('sessionId')
  }

  // Validar que existe access token en cookies
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

  // Validar que existe session ID en cookies
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

  // Formatear datos del usuario para respuesta
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

  // Respuestas de error estándar para autenticación
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

  // Respuesta de éxito estándar
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

  // Formatear respuesta de autenticación con token
  static formatAuthResponse(user: any, token: any) {
    return {
      user: this.formatUserData(user),
      accessToken: token.accessToken || token.token, // Compatibilidad con ambos formatos
      sessionId: token.sessionId,
    }
  }

  static extractFromContext(ctx: HttpContext): string | undefined {
    const token = ctx.request.cookie('accessToken')

    if (token) return token

    const authHeader = ctx.request.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7)
    }

    return undefined
  }
}
