import { HttpContext } from '@adonisjs/core/http'
import { TeamService } from '#services/team_service'
import { createTeamValidator, assignMinerValidator } from '#validators/teams'
import { ErrorHandler } from '#utils/error_handler'

// Helpers
function requireUser(ctx: HttpContext) {
  if (!ctx.user) {
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

export default class TeamController {
  private teamService: TeamService

  constructor() {
    this.teamService = new TeamService()
  }

  async create(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const payload = await ctx.request.validateUsing(createTeamValidator)
      const team = await this.teamService.createTeam(payload)
      return jsonSuccess(ctx.response, 'Equipo creado exitosamente', team, 201)
    } catch (error) {
      ErrorHandler.logError(error, 'TEAM_CREATE')
      return jsonError(ctx.response, error.message || 'Error al crear equipo', 400)
    }
  }

  async assignMiner(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const payload = await ctx.request.validateUsing(assignMinerValidator)
      const team = await this.teamService.assignMinerToTeam(payload)
      return jsonSuccess(ctx.response, 'Minero asignado exitosamente', team)
    } catch (error) {
      ErrorHandler.logError(error, 'TEAM_ASSIGN_MINER')
      return jsonError(ctx.response, error.message || 'Error al asignar minero al equipo', 400)
    }
  }

  async getTeamsBySupervisor(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const teams = await this.teamService.getTeamsBySupervisor(user.id)
      return jsonSuccess(ctx.response, 'Equipos obtenidos exitosamente', teams)
    } catch (error) {
      ErrorHandler.logError(error, 'TEAM_GET_BY_SUPERVISOR')
      return jsonError(ctx.response, error.message || 'Error al obtener equipos', 500)
    }
  }

  async getTeamMiners(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      // Validamos que el usuario sea un minero
      if (user.role !== 'minero') {
        return jsonError(ctx.response, 'Solo los mineros pueden ver a sus compañeros', 403)
      }

      // Obtenemos el teamId desde los parámetros de la URL
      const teamId = ctx.params.teamId

      // Llamamos al servicio para obtener los mineros del equipo
      const miners = await this.teamService.getTeamMiners(teamId)
      return jsonSuccess(ctx.response, 'Compañeros de equipo obtenidos exitosamente', miners)
    } catch (error) {
      ErrorHandler.logError(error, 'TEAM_GET_MINERS')
      return jsonError(ctx.response, error.message || 'Error al obtener compañeros de equipo', 500)
    }
  }
}
