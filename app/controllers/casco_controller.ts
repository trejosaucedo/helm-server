import type { HttpContext } from '@adonisjs/core/http'
import { CascoService } from '#services/casco_service'
import { activateCascoValidator, assignCascoValidator } from '#validators/casco'
import { ErrorHandler } from '#utils/error_handler'

export default class CascoController {
  private cascoService: CascoService

  constructor() {
    this.cascoService = new CascoService()
  }

  async activate({ request, response, user }: HttpContext) {
    try {
      if (!user?.isSupervisor()) {
        return response.status(403).json({
          success: false,
          message: 'Solo los supervisores pueden activar cascos',
          data: null,
        })
      }

      const payload = await request.validateUsing(activateCascoValidator)
      const result = await this.cascoService.activateCasco(user.id, payload)

      return response.status(201).json({
        success: true,
        message: 'Casco activado exitosamente',
        data: result,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_ACTIVATE')
      return ErrorHandler.handleError(error, response, 'Error al activar casco', 400)
    }
  }

  async desactivate({ request, response, user }: HttpContext) {
    try {
      if (!user?.isSupervisor()) {
        return response.status(403).json({
          success: false,
          message: 'Solo los supervisores pueden desactivar cascos',
          data: null,
        })
      }

      const { cascoId } = request.only(['cascoId'])
      await this.cascoService.deactivateCasco(cascoId, user.id)

      return response.status(200).json({
        success: true,
        message: 'Casco desactivado exitosamente',
        data: null,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_DEACTIVATE')
      return ErrorHandler.handleError(error, response, 'Error al desactivar casco', 400)
    }
  }

  async index({ response, user }: HttpContext) {
    try {
      if (!user?.isSupervisor()) {
        return response.status(403).json({
          success: false,
          message: 'Solo los supervisores pueden ver cascos',
          data: null,
        })
      }

      const cascos = await this.cascoService.getCascosBySupervisor(user.id)

      return response.status(200).json({
        success: true,
        message: 'Cascos obtenidos exitosamente',
        data: cascos,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_INDEX')
      return ErrorHandler.handleError(error, response, 'Error al obtener cascos', 500)
    }
  }

  async available({ response, user }: HttpContext) {
    try {
      if (!user?.isSupervisor()) {
        return response.status(403).json({
          success: false,
          message: 'Solo los supervisores pueden ver cascos disponibles',
          data: null,
        })
      }

      const cascos = await this.cascoService.getAvailableCascos(user.id)

      return response.status(200).json({
        success: true,
        message: 'Cascos disponibles obtenidos exitosamente',
        data: cascos,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_AVAILABLE')
      return ErrorHandler.handleError(error, response, 'Error al obtener cascos disponibles', 500)
    }
  }

  async assign({ request, response, user }: HttpContext) {
    try {
      if (!user?.isSupervisor()) {
        return response.status(403).json({
          success: false,
          message: 'Solo los supervisores pueden asignar cascos',
          data: null,
        })
      }

      const payload = await request.validateUsing(assignCascoValidator)
      await this.cascoService.assignCasco(payload.cascoId, payload.mineroId, user.id)

      return response.status(200).json({
        success: true,
        message: 'Casco asignado exitosamente',
        data: null,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_ASSIGN')
      return ErrorHandler.handleError(error, response, 'Error al asignar casco', 400)
    }
  }

  async unassign({ request, response, user }: HttpContext) {
    try {
      if (!user?.isSupervisor()) {
        return response.status(403).json({
          success: false,
          message: 'Solo los supervisores pueden desasignar cascos',
          data: null,
        })
      }

      const { cascoId } = request.only(['cascoId'])
      await this.cascoService.unassignCasco(cascoId, user.id)

      return response.status(200).json({
        success: true,
        message: 'Casco desasignado exitosamente',
        data: null,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_UNASSIGN')
      return ErrorHandler.handleError(error, response, 'Error al desasignar casco', 400)
    }
  }
}
