import type { HttpContext } from '@adonisjs/core/http'
import { CascoService } from '#services/casco_service'
import {
  activateCascoValidator,
  assignCascoValidator,
  createCascoValidator,
} from '#validators/casco'
import { ErrorHandler } from '#utils/error_handler'

// Helpers
function requireUser(ctx: HttpContext) {
  if (!ctx.user) {
    // Respondemos aquí y retornamos undefined, no lanzamos error
    ctx.response.status(401).json({
      success: false,
      message: 'No autenticado',
      data: null,
    })
    return undefined
  }
  return ctx.user
}

function jsonSuccess(
  response: HttpContext['response'],
  message: string,
  data: any = null,
  status = 200
) {
  return response.status(status).json({ success: true, message, data })
}

function jsonError(
  response: HttpContext['response'],
  message: string,
  status = 400,
  data: any = null
) {
  return response.status(status).json({ success: false, message, data })
}

export default class CascoController {
  private cascoService: CascoService

  constructor() {
    this.cascoService = new CascoService()
  }

  async my_helmets(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const cascos = await this.cascoService.getCascosBySupervisor(user.id)
      return jsonSuccess(ctx.response, 'Cascos obtenidos exitosamente', cascos)
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_MY_HELMETS')
      return jsonError(ctx.response, error.message || 'Error al obtener cascos', 500)
    }
  }

  async activate(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const payload = await ctx.request.validateUsing(activateCascoValidator)
      const activationData = { ...payload, supervisorId: user.id }
      const result = await this.cascoService.activateCasco(activationData)
      return jsonSuccess(ctx.response, 'Casco activado exitosamente', result, 201)
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_ACTIVATE')
      return jsonError(ctx.response, error.message || 'Error al activar casco', 400)
    }
  }

  async desactivate(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const cascoId = ctx.request.input('cascoId')
      const desactivationData = { cascoId, supervisorId: user.id }
      await this.cascoService.deactivateCasco(desactivationData)
      return jsonSuccess(ctx.response, 'Casco desactivado exitosamente')
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_DEACTIVATE')
      return jsonError(ctx.response, error.message || 'Error al desactivar casco', 400)
    }
  }

  async index(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const cascos = await this.cascoService.getCascosBySupervisor(user.id)
      return jsonSuccess(ctx.response, 'Cascos obtenidos exitosamente', cascos)
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_INDEX')
      return jsonError(ctx.response, error.message || 'Error al obtener cascos', 500)
    }
  }

  async available(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const cascos = await this.cascoService.getAvailableCascos(user.id)
      return jsonSuccess(ctx.response, 'Cascos disponibles obtenidos exitosamente', cascos)
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_AVAILABLE')
      return jsonError(ctx.response, error.message || 'Error al obtener cascos disponibles', 500)
    }
  }

  async assign(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const payload = await ctx.request.validateUsing(assignCascoValidator)
      const assignData = { ...payload, supervisorId: user.id }
      await this.cascoService.assignCasco(assignData)
      return jsonSuccess(ctx.response, 'Casco asignado exitosamente')
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_ASSIGN')
      return jsonError(ctx.response, error.message || 'Error al asignar casco', 400)
    }
  }

  async unassign(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const cascoId = ctx.request.input('cascoId')
      const unassignData = { cascoId, supervisorId: user.id }
      await this.cascoService.unassignCasco(unassignData)
      return jsonSuccess(ctx.response, 'Casco desasignado exitosamente')
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_UNASSIGN')
      return jsonError(ctx.response, error.message || 'Error al desasignar casco', 400)
    }
  }

  async create({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createCascoValidator)
      const newCasco = await this.cascoService.createCascoAdmin({
        supervisorId: payload.supervisorId,
        physicalId: payload.physicalId,
      })

      return response.created({
        success: true,
        message: 'Casco creado exitosamente',
        data: newCasco,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_CREATE')
      return ErrorHandler.handleError(error, response, 'Error al crear casco', 400)
    }
  }
}
