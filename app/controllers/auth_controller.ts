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
import { updateProfileValidator } from '#validators/auth'
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

  // Obtiene el perfil del usuario autenticado (alias de /me para compatibilidad frontend)
  getProfile = withUser(async (user, { response }) => {
    return TokenUtils.successResponse(
      response,
      'Perfil obtenido exitosamente',
      TokenUtils.formatUserData(user)
    )
  })

  // Actualiza datos básicos del perfil del usuario autenticado
  updateProfile = withUser(async (user, { request, response }) => {
<<<<<<< HEAD
    if (user.role === 'admin') {
      return response.status(403).json({
        success: false,
        message: 'Los administradores no pueden editar su perfil',
        data: null,
      })
    }
    const payload = await request.validateUsing(updateProfileValidator)
    const updated = await this.userRepository.update({ id: user.id, ...payload } as any)
    if (!updated) {
      return response
        .status(404)
        .json({ success: false, message: 'Usuario no encontrado', data: null })
    }
    return TokenUtils.successResponse(
      response,
      'Perfil actualizado exitosamente',
      TokenUtils.formatUserData(updated)
    )
=======
    try {
      const body = await request.validateUsing(updateProfileValidator)
      const updated = await this.userRepository.update({ id: user.id, ...body } as any)
      if (!updated) {
        return ResponseHelper.error(response, 'Usuario no encontrado', 404)
      }
      return TokenUtils.successResponse(
        response,
        'Perfil actualizado exitosamente',
        TokenUtils.formatUserData(updated)
      )
    } catch (error) {
      ErrorHandler.logError(error, 'AUTH_UPDATE_PROFILE')
      return ErrorHandler.handleError(error, response, 'Error al actualizar perfil', 400)
    }
>>>>>>> eb9c49f1a36c2a6b9fa38a427414bc97fdf3015f
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
      console.log('Email recibido para código de acceso:', email)

      // 3. Llama al servicio pasando el usuario completo
      const result = await this.authService.createAccessCodeForSupervisor(email)
      console.log('Código de acceso generado correctamente:', result)

      return response.created({
        success: true,
        message: 'Código de acceso generado correctamente',
        data: result,
      })
    } catch (error) {
      console.error('Error real al crear código de acceso:', error)
      return ResponseHelper.error(response, error.message || 'Error al generar código de acceso')
    }
  }

  async listSupervisors({ response }: HttpContext) {
    try {
      const supervisors = await this.userRepository.getUsersByRole('supervisor')
      return response.json({
        success: true,
        message: 'Supervisores obtenidos exitosamente',
        data: supervisors,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'LIST_SUPERVISORS')
      return response
        .status(500)
        .json({ success: false, message: 'Error al obtener supervisores', data: null })
    }
  }

  async listMiners({ response }: HttpContext) {
    try {
      const miners = await this.userRepository.getUsersByRole('minero')
      return response.json({
        success: true,
        message: 'Mineros obtenidos exitosamente',
        data: miners,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'LIST_MINERS')
      return response
        .status(500)
        .json({ success: false, message: 'Error al obtener mineros', data: null })
    }
  }

  async listMinersBySupervisor(ctx: HttpContext) {
    try {
      const user = (ctx as any).user
      const miners = await this.userRepository.getMinerosBySupervisor(user.id)
<<<<<<< HEAD
      return response.json({
        success: true,
        message: 'Mineros del supervisor obtenidos exitosamente',
        data: miners,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'LIST_MINERS_BY_SUPERVISOR')
      return response
        .status(500)
        .json({ success: false, message: 'Error al obtener mineros del supervisor', data: null })
=======
      return ctx.response.json({ success: true, message: 'Mineros del supervisor obtenidos exitosamente', data: miners })
    } catch (error) {
      ErrorHandler.logError(error, 'LIST_MINERS_BY_SUPERVISOR')
      return ctx.response.status(500).json({ success: false, message: 'Error al obtener mineros del supervisor', data: null })
>>>>>>> eb9c49f1a36c2a6b9fa38a427414bc97fdf3015f
    }
  }

  async minersStatsBySupervisor(ctx: HttpContext) {
    try {
      const user = (ctx as any).user
      const miners = await this.userRepository.getMinerosBySupervisor(user.id)
      const total = miners.length
<<<<<<< HEAD
      return response.json({
        success: true,
        message: 'Estadísticas de mineros del supervisor obtenidas exitosamente',
        data: { total },
      })
    } catch (error) {
      ErrorHandler.logError(error, 'MINERS_STATS_BY_SUPERVISOR')
      return response.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas de mineros del supervisor',
        data: null,
      })
=======
      return ctx.response.json({ success: true, message: 'Estadísticas de mineros del supervisor obtenidas exitosamente', data: { total } })
    } catch (error) {
      ErrorHandler.logError(error, 'MINERS_STATS_BY_SUPERVISOR')
      return ctx.response.status(500).json({ success: false, message: 'Error al obtener estadísticas de mineros del supervisor', data: null })
>>>>>>> eb9c49f1a36c2a6b9fa38a427414bc97fdf3015f
    }
  }

  async getAccessCodesByEmail({ params, response }: HttpContext) {
    try {
      const email = decodeURIComponent(params.email)
      const code = await this.accessCodeRepository.getCodeByEmail(email)
      if (!code) {
        return response.status(404).json({
          success: false,
          message: 'No se encontró un código de acceso para este email',
          data: null,
        })
      }
      return response.json({
        success: true,
        message: 'Código de acceso obtenido exitosamente',
        data: code,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'GET_ACCESS_CODES_BY_EMAIL')
      return response
        .status(500)
        .json({ success: false, message: 'Error al obtener código de acceso', data: null })
    }
  }

  async minersStats({ response }: HttpContext) {
    try {
      const miners = await this.userRepository.getUsersByRole('minero')
      const total = miners.length
      return response.json({
        success: true,
        message: 'Estadísticas de mineros obtenidas exitosamente',
        data: { total },
      })
    } catch (error) {
      ErrorHandler.logError(error, 'MINERS_STATS')
      return response
        .status(500)
        .json({ success: false, message: 'Error al obtener estadísticas de mineros', data: null })
    }
  }

  async updateMinero(ctx: HttpContext) {
    try {
      const req = (ctx as any).request
      const res = (ctx as any).response
      const params = (ctx as any).params
      const user = (ctx as any).user
      const id = params.id
      const payload = await req.validateUsing(updateMineroValidator)
      // Autorización: admin siempre; supervisor sólo si el minero le pertenece
      if (user && user.role === 'supervisor') {
        const target = await this.userRepository.findById(id)
        if (!target || target.role !== 'minero' || target.supervisorId !== user.id) {
          return ResponseHelper.forbidden(res, 'No tienes acceso a esta sección')
        }
      }

      const updated = await this.userRepository.updateMinero({ id, ...payload })
      if (!updated) {
<<<<<<< HEAD
        return response
          .status(404)
          .json({ success: false, message: 'Minero no encontrado', data: null })
      }
      return response.json({
        success: true,
        message: 'Minero actualizado exitosamente',
        data: updated,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'UPDATE_MINERO')
      return response
        .status(400)
        .json({ success: false, message: 'Error al actualizar minero', data: null })
=======
        return res.status(404).json({ success: false, message: 'Minero no encontrado', data: null })
      }
      return res.json({ success: true, message: 'Minero actualizado exitosamente', data: updated })
    } catch (error) {
      ErrorHandler.logError(error, 'UPDATE_MINERO')
      return (ctx as any).response.status(400).json({ success: false, message: 'Error al actualizar minero', data: null })
>>>>>>> eb9c49f1a36c2a6b9fa38a427414bc97fdf3015f
    }
  }

  async deleteMinero({ response, params }: HttpContext) {
    try {
      const id = params.id
      const user = await this.userRepository.findById(id)
      if (!user) {
        return response
          .status(404)
          .json({ success: false, message: 'Minero no encontrado', data: null })
      }
      await user.delete()
      return response.json({ success: true, message: 'Minero eliminado exitosamente' })
    } catch (error) {
      ErrorHandler.logError(error, 'DELETE_MINERO')
      return response
        .status(400)
        .json({ success: false, message: 'Error al eliminar minero', data: null })
    }
  }

  async getMinero(ctx: HttpContext) {
    try {
<<<<<<< HEAD
      const id = params.id
      const minero = await this.userRepository.findById(id)
      if (!minero || minero.role !== 'minero') {
        return response
          .status(404)
          .json({ success: false, message: 'Minero no encontrado', data: null })
      }
      return response.json({
        success: true,
        message: 'Detalle de minero obtenido exitosamente',
        data: minero,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'GET_MINERO_DETAIL')
      return response
        .status(400)
        .json({ success: false, message: 'Error al obtener detalle de minero', data: null })
=======
      const id = (ctx as any).params.id
      const user = (ctx as any).user
      const minero = await this.userRepository.findById(id)
      if (!minero || minero.role !== 'minero') {
        return (ctx as any).response.status(404).json({ success: false, message: 'Minero no encontrado', data: null })
      }
      // Supervisores solo pueden ver mineros propios
      if (user && user.role === 'supervisor' && minero.supervisorId !== user.id) {
        return ResponseHelper.forbidden((ctx as any).response, 'No tienes acceso a esta sección')
      }
      return (ctx as any).response.json({ success: true, message: 'Detalle de minero obtenido exitosamente', data: minero })
    } catch (error) {
      ErrorHandler.logError(error, 'GET_MINERO_DETAIL')
      return (ctx as any).response.status(400).json({ success: false, message: 'Error al obtener detalle de minero', data: null })
>>>>>>> eb9c49f1a36c2a6b9fa38a427414bc97fdf3015f
    }
  }

  async getAllAccessCodes({ response }: HttpContext) {
    try {
      const codes = await this.accessCodeRepository.getAllCodes()
      return response.json({
        success: true,
        message: 'Códigos de acceso obtenidos exitosamente',
        data: codes,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'GET_ALL_ACCESS_CODES')
      return response.status(500).json({
        success: false,
        message: 'Error al obtener códigos de acceso',
        data: null,
      })
    }
  }
}
