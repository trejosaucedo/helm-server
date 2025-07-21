import type { HttpContext } from '@adonisjs/core/http'
import {
  registerSupervisorValidator,
  loginValidator,
  registerMineroValidator,
  changePasswordValidator,
  emailValidator,
  updateMineroValidator,
} from '#validators/auth'
import { AuthService } from '#services/auth_service'
import { ErrorHandler } from '#utils/error_handler'
import { TokenUtils } from '#utils/token_utils'
import { withUser, withSession } from '#utils/controller_helpers'
import { ResponseHelper } from '#utils/response_helper'
import { UserRepository } from '#repositories/user_repository'
import { AccessCodeRepository } from '#repositories/acces_code_repository'

export default class AuthController {
  private authService: AuthService
  private userRepository: UserRepository
  private accessCodeRepository: AccessCodeRepository

  constructor() {
    this.authService = new AuthService()
    this.userRepository = new UserRepository()
    this.accessCodeRepository = new AccessCodeRepository()
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

  createAccessCodeForSupervisor = async ({ request, response }: HttpContext) => {
    try {
      // 1. Valida el body
      const { email } = await request.validateUsing(emailValidator)
      console.log('Email recibido para código de acceso:', email);

      // 3. Llama al servicio pasando el usuario completo
      const result = await this.authService.createAccessCodeForSupervisor(email)
      console.log('Código de acceso generado correctamente:', result);

      return response.created({
        success: true,
        message: 'Código de acceso generado correctamente',
        data: result,
      })
    } catch (error) {
      console.error('Error real al crear código de acceso:', error);
      return ResponseHelper.error(response, error.message || 'Error al generar código de acceso');
    }
  }

  async listSupervisors({ response }: HttpContext) {
    try {
      const supervisors = await this.userRepository.getUsersByRole('supervisor')
      return response.json({ success: true, message: 'Supervisores obtenidos exitosamente', data: supervisors })
    } catch (error) {
      ErrorHandler.logError(error, 'LIST_SUPERVISORS')
      return response.status(500).json({ success: false, message: 'Error al obtener supervisores', data: null })
    }
  }

  async listMiners({ response }: HttpContext) {
    try {
      const miners = await this.userRepository.getUsersByRole('minero')
      return response.json({ success: true, message: 'Mineros obtenidos exitosamente', data: miners })
    } catch (error) {
      ErrorHandler.logError(error, 'LIST_MINERS')
      return response.status(500).json({ success: false, message: 'Error al obtener mineros', data: null })
    }
  }

  async getAccessCodesByEmail({ params, response }: HttpContext) {
    try {
      const email = decodeURIComponent(params.email)
      const code = await this.accessCodeRepository.getCodeByEmail(email)
      if (!code) {
        return response.status(404).json({ success: false, message: 'No se encontró un código de acceso para este email', data: null })
      }
      return response.json({ success: true, message: 'Código de acceso obtenido exitosamente', data: code })
    } catch (error) {
      ErrorHandler.logError(error, 'GET_ACCESS_CODES_BY_EMAIL')
      return response.status(500).json({ success: false, message: 'Error al obtener código de acceso', data: null })
    }
  }

  async minersStats({ response }: HttpContext) {
    try {
      const miners = await this.userRepository.getUsersByRole('minero')
      const total = miners.length
      return response.json({ success: true, message: 'Estadísticas de mineros obtenidas exitosamente', data: { total } })
    } catch (error) {
      ErrorHandler.logError(error, 'MINERS_STATS')
      return response.status(500).json({ success: false, message: 'Error al obtener estadísticas de mineros', data: null })
    }
  }

  async updateMinero({ request, response, params }: HttpContext) {
    try {
      const id = params.id
      const payload = await request.validateUsing(updateMineroValidator)
      const updated = await this.userRepository.updateMinero({ id, ...payload })
      if (!updated) {
        return response.status(404).json({ success: false, message: 'Minero no encontrado', data: null })
      }
      return response.json({ success: true, message: 'Minero actualizado exitosamente', data: updated })
    } catch (error) {
      ErrorHandler.logError(error, 'UPDATE_MINERO')
      return response.status(400).json({ success: false, message: 'Error al actualizar minero', data: null })
    }
  }

  async deleteMinero({ response, params }: HttpContext) {
    try {
      const id = params.id
      const user = await this.userRepository.findById(id)
      if (!user) {
        return response.status(404).json({ success: false, message: 'Minero no encontrado', data: null })
      }
      await user.delete()
      return response.json({ success: true, message: 'Minero eliminado exitosamente' })
    } catch (error) {
      ErrorHandler.logError(error, 'DELETE_MINERO')
      return response.status(400).json({ success: false, message: 'Error al eliminar minero', data: null })
    }
  }

  async getMinero({ params, response }: HttpContext) {
    try {
      const id = params.id;
      const minero = await this.userRepository.findById(id);
      if (!minero || minero.role !== 'minero') {
        return response.status(404).json({ success: false, message: 'Minero no encontrado', data: null });
      }
      return response.json({ success: true, message: 'Detalle de minero obtenido exitosamente', data: minero });
    } catch (error) {
      ErrorHandler.logError(error, 'GET_MINERO_DETAIL');
      return response.status(400).json({ success: false, message: 'Error al obtener detalle de minero', data: null });
    }
  }
}
