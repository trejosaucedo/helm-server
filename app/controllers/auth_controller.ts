import type { HttpContext } from '@adonisjs/core/http'
import {
  registerSupervisorValidator,
  loginValidator,
  registerMineroValidator,
  changePasswordValidator,
} from '#validators/auth'
import { AuthService } from '#services/auth_service'
import { ErrorHandler } from '#utils/error_handler'
import { TokenUtils } from '#utils/token_utils'
import { withUser, withSession } from '#utils/controller_helpers'

export default class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  // Login y registro sí necesitan lógica propia
  async login({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(loginValidator)
      const result = await this.authService.login(payload)
      TokenUtils.setAuthCookies(response, result.sessionId, result.accessToken)
      return TokenUtils.successResponse(response, 'Login exitoso', {
        user: result.user,
        accessToken: result.accessToken,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_LOGIN')
      return ErrorHandler.handleError(error, response, 'Error al iniciar sesión', 401)
    }
  }

  async register({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(registerSupervisorValidator)
      const result = await this.authService.register(payload)
      TokenUtils.setAuthCookies(response, result.sessionId, result.accessToken)
      return TokenUtils.successResponse(
        response,
        'Usuario registrado exitosamente',
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        201
      )
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_REGISTER')
      return ErrorHandler.handleError(error, response, 'Error al registrar usuario', 400)
    }
  }

  me = withUser(async (user, { response }) => {
    return TokenUtils.successResponse(
      response,
      'Usuario obtenido exitosamente',
      TokenUtils.formatUserData(user)
    )
  })

  changePassword = withUser(async (user, { request, response }) => {
    const payload = await request.validateUsing(changePasswordValidator)
    await this.authService.changePassword(user, payload)
    return TokenUtils.successResponse(response, 'Contraseña cambiada exitosamente')
  })

  getSessions = withUser(async (user, { response }) => {
    const sessions = await this.authService.getActiveSessions(user.id)
    return TokenUtils.successResponse(response, 'Sesiones obtenidas exitosamente', sessions)
  })

  revokeSession = withUser(async (user, { request, response }) => {
    const sessionIdToRevoke = request.param('sessionId')
    await this.authService.revokeSession(user.id, sessionIdToRevoke)
    return TokenUtils.successResponse(response, 'Sesión revocada exitosamente')
  })

  registerMinero = withUser(async (user, { request, response }) => {
    const payload = await request.validateUsing(registerMineroValidator)
    const result = await this.authService.registerMinero(payload, user.id)
    return TokenUtils.successResponse(response, 'Minero registrado exitosamente', result, 201)
  })

  refresh = withSession(async (user, sessionId, { response }) => {
    const newAccessToken = await this.authService.refreshToken(sessionId)
    if (!newAccessToken) {
      TokenUtils.clearAuthCookies(response)
      return TokenUtils.unauthorizedResponse(response, 'Sesión inválida o expirada')
    }
    TokenUtils.setAccessTokenCookie(response, newAccessToken)
    return TokenUtils.successResponse(response, 'Token renovado exitosamente', {
      user: TokenUtils.formatUserData(user),
      accessToken: newAccessToken,
    })
  })

  logout = withSession(async (user, sessionId, { response }) => {
    await this.authService.logout(sessionId, user.id)
    TokenUtils.clearAuthCookies(response)
    return TokenUtils.successResponse(response, 'Logout exitoso')
  })

  logoutAll = withSession(async (user, _sessionId, { response }) => {
    await this.authService.logoutAll(user.id)
    TokenUtils.clearAuthCookies(response)
    return TokenUtils.successResponse(response, 'Todas las sesiones cerradas exitosamente')
  })


}
