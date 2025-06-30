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
import User from '#models/user'

export default class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  async login({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(loginValidator)
      const result = await this.authService.login(payload)

      // Configurar cookies de autenticación usando TokenUtils
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

      // Configurar cookies de autenticación usando TokenUtils
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

  async registerMinero({ request, response }: HttpContext) {
    try {
      // Validar presencia de access token
      const tokenValidation = TokenUtils.validateAccessTokenPresence(request)
      if (!tokenValidation.isValid) {
        return TokenUtils.unauthorizedResponse(response, 'Token requerido')
      }

      const validation = await User.validateAccessToken(tokenValidation.token!)
      if (!validation) {
        return TokenUtils.unauthorizedResponse(response, 'Token inválido')
      }

      if (!validation.user.isSupervisor()) {
        return TokenUtils.forbiddenResponse(
          response,
          'Solo los supervisores pueden registrar mineros'
        )
      }

      const payload = await request.validateUsing(registerMineroValidator)
      const result = await this.authService.registerMinero(payload, validation.user.id)

      return TokenUtils.successResponse(response, 'Minero registrado exitosamente', result, 201)
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_REGISTER_MINER')
      return ErrorHandler.handleError(error, response, 'Error al registrar minero', 400)
    }
  }

  async refresh({ request, response }: HttpContext) {
    try {
      // Validar presencia de session ID
      const sessionValidation = TokenUtils.validateSessionIdPresence(request)
      if (!sessionValidation.isValid) {
        return TokenUtils.unauthorizedResponse(response, 'Sesión requerida')
      }

      const newAccessToken = await this.authService.refreshToken(sessionValidation.sessionId!)
      if (!newAccessToken) {
        // Limpiar cookies inválidas
        TokenUtils.clearAuthCookies(response)
        return TokenUtils.unauthorizedResponse(response, 'Sesión inválida o expirada')
      }

      // Obtener datos del usuario para la respuesta
      const user = await this.authService.validateSession(sessionValidation.sessionId!)
      if (!user) {
        TokenUtils.clearAuthCookies(response)
        return TokenUtils.unauthorizedResponse(response, 'Sesión inválida')
      }

      // Configurar nuevo access token en cookie
      TokenUtils.setAccessTokenCookie(response, newAccessToken)

      return TokenUtils.successResponse(response, 'Token renovado exitosamente', {
        user: TokenUtils.formatUserData(user),
        accessToken: newAccessToken,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_REFRESH')
      return ErrorHandler.handleError(error, response, 'Error al renovar token', 401)
    }
  }

  async logout({ request, response }: HttpContext) {
    try {
      // Validar presencia de session ID
      const sessionValidation = TokenUtils.validateSessionIdPresence(request)
      if (!sessionValidation.isValid) {
        return TokenUtils.unauthorizedResponse(response, 'Sesión requerida')
      }

      const user = await this.authService.validateSession(sessionValidation.sessionId!)
      if (!user) {
        return TokenUtils.unauthorizedResponse(response, 'Sesión inválida')
      }

      await this.authService.logout(sessionValidation.sessionId!, user)

      // Limpiar cookies
      TokenUtils.clearAuthCookies(response)

      return TokenUtils.successResponse(response, 'Logout exitoso')
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_LOGOUT')
      return ErrorHandler.handleError(error, response, 'Error al cerrar sesión', 500)
    }
  }

  async logoutAll({ request, response }: HttpContext) {
    try {
      // Validar presencia de session ID
      const sessionValidation = TokenUtils.validateSessionIdPresence(request)
      if (!sessionValidation.isValid) {
        return TokenUtils.unauthorizedResponse(response, 'Sesión requerida')
      }

      const user = await this.authService.validateSession(sessionValidation.sessionId!)
      if (!user) {
        return TokenUtils.unauthorizedResponse(response, 'Sesión inválida')
      }

      await this.authService.logoutAll(user)

      // Limpiar cookies
      TokenUtils.clearAuthCookies(response)

      return TokenUtils.successResponse(response, 'Todas las sesiones cerradas exitosamente')
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_LOGOUT_ALL')
      return ErrorHandler.handleError(error, response, 'Error al cerrar sesiones', 500)
    }
  }

  async me({ request, response }: HttpContext) {
    try {
      // Validar presencia de access token
      const tokenValidation = TokenUtils.validateAccessTokenPresence(request)
      if (!tokenValidation.isValid) {
        return TokenUtils.unauthorizedResponse(response, 'Token requerido')
      }

      const validation = await this.authService.validateAccessToken(tokenValidation.token!)
      if (!validation) {
        return TokenUtils.unauthorizedResponse(response, 'Token inválido')
      }

      return TokenUtils.successResponse(
        response,
        'Usuario obtenido exitosamente',
        TokenUtils.formatUserData(validation.user)
      )
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_ME')
      return ErrorHandler.handleError(error, response, 'Error al obtener usuario', 500)
    }
  }

  async changePassword({ request, response }: HttpContext) {
    try {
      // Validar presencia de access token
      const tokenValidation = TokenUtils.validateAccessTokenPresence(request)
      if (!tokenValidation.isValid) {
        return TokenUtils.unauthorizedResponse(response, 'Token requerido')
      }

      const validation = await this.authService.validateAccessToken(tokenValidation.token!)
      if (!validation) {
        return TokenUtils.unauthorizedResponse(response, 'Token inválido')
      }

      const payload = await request.validateUsing(changePasswordValidator)
      await this.authService.changePassword(validation.user, payload)

      return TokenUtils.successResponse(response, 'Contraseña cambiada exitosamente')
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_CHANGE_PASSWORD')
      return ErrorHandler.handleError(error, response, 'Error al cambiar contraseña', 400)
    }
  }

  async getSessions({ request, response }: HttpContext) {
    try {
      // Validar presencia de access token
      const tokenValidation = TokenUtils.validateAccessTokenPresence(request)
      if (!tokenValidation.isValid) {
        return TokenUtils.unauthorizedResponse(response, 'Token requerido')
      }

      const validation = await this.authService.validateAccessToken(tokenValidation.token!)
      if (!validation) {
        return TokenUtils.unauthorizedResponse(response, 'Token inválido')
      }

      const sessions = await validation.user.getActiveSessions()

      return TokenUtils.successResponse(response, 'Sesiones obtenidas exitosamente', sessions)
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_GET_SESSIONS')
      return ErrorHandler.handleError(error, response, 'Error al obtener sesiones', 500)
    }
  }

  async revokeSession({ request, response }: HttpContext) {
    try {
      // Validar presencia de access token
      const tokenValidation = TokenUtils.validateAccessTokenPresence(request)
      if (!tokenValidation.isValid) {
        return TokenUtils.unauthorizedResponse(response, 'Token requerido')
      }

      const validation = await this.authService.validateAccessToken(tokenValidation.token!)
      if (!validation) {
        return TokenUtils.unauthorizedResponse(response, 'Token inválido')
      }

      const sessionIdToRevoke = request.param('sessionId')
      await validation.user.revokeSession(sessionIdToRevoke)

      return TokenUtils.successResponse(response, 'Sesión revocada exitosamente')
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_REVOKE_SESSION')
      return ErrorHandler.handleError(error, response, 'Error al revocar sesión', 500)
    }
  }
}
