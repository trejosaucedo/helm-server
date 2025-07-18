import type { HttpContext } from '@adonisjs/core/http'
import { AuthService } from '#services/auth_service'
import { ErrorHandler } from '#utils/error_handler'
import { withUser } from '#utils/controller_helpers'
import { ResponseHelper } from '#utils/response_helper'

export default class AccessCodeController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  createAccessCodeForSupervisor = withUser(async (_user, { request, response }: HttpContext) => {
    try {
      const { email } = request.only(['email'])

      if (!email) {
        return ResponseHelper.error(response, 'Email requerido')
      }

      const result = await this.authService.createAccessCodeForSupervisor(email)

      return response.created({
        success: true,
        message: 'Código de acceso generado correctamente',
        data: result,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'ACCESS_CODE_CREATE')
      return ErrorHandler.handleError(error, response, 'Error al generar código de acceso', 400)
    }
  })
}
