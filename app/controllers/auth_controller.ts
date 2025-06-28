// app/controllers/auth_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import {
  registerSupervisorValidator,
  loginValidator,
  registerMineroValidator,
  changePasswordValidator,
} from '#validators/auth'
import { AuthService } from '#services/auth_service'
import { TokenUtils } from '#utils/token_utils'
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
      const status = error.message?.includes('ya está registrado') ? 409 : 400

      return response.status(status).json({
        success: false,
        message: error.message || 'Error al registrar usuario',
        data: null,
      })
    }
  }

  async registerMinero({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(registerMineroValidator)
      const result = await this.authService.registerMinero(payload)

      return response.status(201).json({
        success: true,
        message: 'Minero registrado exitosamente',
        data: result,
      })
    } catch (error) {
      const status = error.message?.includes('ya está registrado') ? 409 : 400

      return response.status(status).json({
        success: false,
        message: error.message || 'Error al registrar minero',
        data: null,
      })
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
      return response.status(401).json({
        success: false,
        message: error.message || 'Error al iniciar sesión',
        data: null,
      })
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
      return response.status(500).json({
        success: false,
        message: 'Error al cerrar sesión',
        data: null,
      })
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
      return response.status(500).json({
        success: false,
        message: 'Error al cerrar sesiones',
        data: null,
      })
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
      return response.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
        data: null,
      })
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
      return response.status(400).json({
        success: false,
        message: error.message || 'Error al cambiar contraseña',
        data: null,
      })
    }
  }
}
