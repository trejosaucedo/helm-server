import type { HttpContext } from '@adonisjs/core/http'
import {
  registerSupervisorValidator,
  loginValidator,
  registerMineroValidator,
  changePasswordValidator,
} from '#validators/auth'
import { AuthService } from '#services/auth_service'
import { TokenUtils } from '#utils/token_utils'
import { ErrorHandler } from '#utils/error_handler'
import User from '#models/user'

export default class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  async register({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(registerSupervisorValidator)
      const result = await this.authService.register(payload)

      return response.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_REGISTER')
      return ErrorHandler.handleError(error, response, 'Error al registrar usuario', 400)
    }
  }

  async registerMinero({ request, response }: HttpContext) {
    try {
      const token = TokenUtils.extractFromRequest(request)
      if (!token) {
        return response.status(401).json({
          success: false,
          message: 'Token requerido',
          data: null,
        })
      }

      const validation = await User.validateToken(token)
      if (!validation) {
        return response.status(401).json({
          success: false,
          message: 'Token inválido',
          data: null,
        })
      }

      if (!validation.user.isSupervisor()) {
        return response.status(403).json({
          success: false,
          message: 'Solo los supervisores pueden registrar mineros',
          data: null,
        })
      }

      const payload = await request.validateUsing(registerMineroValidator)
      const result = await this.authService.registerMinero(payload, validation.user.id)

      return response.status(201).json({
        success: true,
        message: 'Minero registrado exitosamente',
        data: result,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_REGISTER_MINER')
      return ErrorHandler.handleError(error, response, 'Error al registrar minero', 400)
    }
  }

  async login({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(loginValidator)
      const result = await this.authService.login(payload)

      return response.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: result,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_LOGIN')
      return ErrorHandler.handleError(error, response, 'Error al iniciar sesión', 401)
    }
  }

  async logout({ request, response }: HttpContext) {
    try {
      const token = TokenUtils.extractFromRequest(request)

      if (!token) {
        return response.status(401).json({
          success: false,
          message: 'Token requerido',
          data: null,
        })
      }

      const validation = await User.validateToken(token)

      if (!validation) {
        return response.status(401).json({
          success: false,
          message: 'Token inválido',
          data: null,
        })
      }

      await this.authService.logout(token, validation.user)

      return response.status(200).json({
        success: true,
        message: 'Logout exitoso',
        data: null,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_LOGOUT')
      return ErrorHandler.handleError(error, response, 'Error al cerrar sesión', 500)
    }
  }

  async logoutAll({ request, response }: HttpContext) {
    try {
      const token = TokenUtils.extractFromRequest(request)

      if (!token) {
        return response.status(401).json({
          success: false,
          message: 'Token requerido',
          data: null,
        })
      }

      const validation = await User.validateToken(token)

      if (!validation) {
        return response.status(401).json({
          success: false,
          message: 'Token inválido',
          data: null,
        })
      }

      await this.authService.logoutAll(validation.user)

      return response.status(200).json({
        success: true,
        message: 'Todas las sesiones cerradas exitosamente',
        data: null,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_LOGOUT_ALL')
      return ErrorHandler.handleError(error, response, 'Error al cerrar sesiones', 500)
    }
  }

  async me({ request, response }: HttpContext) {
    try {
      const token = TokenUtils.extractFromRequest(request)

      if (!token) {
        return response.status(401).json({
          success: false,
          message: 'Token requerido',
          data: null,
        })
      }

      const validation = await User.validateToken(token)

      if (!validation) {
        return response.status(401).json({
          success: false,
          message: 'Token inválido',
          data: null,
        })
      }

      const user = validation.user

      return response.status(200).json({
        success: true,
        message: 'Usuario obtenido exitosamente',
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          cascoId: user.cascoId,
          createdAt: user.createdAt.toISO(),
          updatedAt: user.updatedAt?.toISO() || null,
        },
      })
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_ME')
      return ErrorHandler.handleError(error, response, 'Error al obtener usuario', 500)
    }
  }

  async changePassword({ request, response }: HttpContext) {
    try {
      const token = TokenUtils.extractFromRequest(request)

      if (!token) {
        return response.status(401).json({
          success: false,
          message: 'Token requerido',
          data: null,
        })
      }

      const validation = await User.validateToken(token)

      if (!validation) {
        return response.status(401).json({
          success: false,
          message: 'Token inválido',
          data: null,
        })
      }

      const payload = await request.validateUsing(changePasswordValidator)
      await this.authService.changePassword(validation.user, payload)

      return response.status(200).json({
        success: true,
        message: 'Contraseña cambiada exitosamente',
        data: null,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_CHANGE_PASSWORD')
      return ErrorHandler.handleError(error, response, 'Error al cambiar contraseña', 400)
    }
  }
}
