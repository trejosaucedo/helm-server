import type { HttpContext } from '@adonisjs/core/http'
import { AuthService } from '#services/auth_service'
import { ErrorHandler } from '#utils/error_handler'
import { TokenUtils } from '#utils/token_utils'
import { withUser } from '#utils/controller_helpers'
import { ResponseHelper } from '#utils/response_helper'

export default class AccessCodeController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  createAccessCodeForSupervisor = withUser(async (user, { request, response }: HttpContext) => {
    try {
      console.log('AccessCodeController: Iniciando generación de código')
      const { email } = request.only(['email'])
      
      console.log('AccessCodeController: Email recibido:', email)
      
      if (!email) {
        console.log('AccessCodeController: Email no proporcionado')
        return ResponseHelper.error(new Error('El email es requerido'), 'Email requerido')
      }

      // Validar que el usuario sea admin
      if (user.role !== 'admin') {
        console.log('AccessCodeController: Usuario no es admin, rol:', user.role)
        return ResponseHelper.error(new Error('Solo los administradores pueden generar códigos'), 'Acceso denegado')
      }

      console.log('AccessCodeController: Llamando al servicio para generar código')
      const result = await this.authService.createAccessCodeForSupervisor(user, email)
      
      console.log('AccessCodeController: Código generado exitosamente:', result)
      
      return response.created({
        success: true,
        message: 'Código de acceso generado correctamente',
        data: result,
      })
    } catch (error) {
      console.error('AccessCodeController: Error:', error)
      ErrorHandler.logError(error, 'ACCESS_CODE_CREATE')
      return ErrorHandler.handleError(error, response, 'Error al generar código de acceso', 400)
    }
  })
} 