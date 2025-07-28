import type { HttpContext } from '@adonisjs/core/http'
import { DashboardService } from '#services/dashboard_service'
import { ErrorHandler } from '#utils/error_handler'
import { ResponseHelper } from '#utils/response_helper'

export default class DashboardController {
  private dashboardService: DashboardService

  constructor() {
    this.dashboardService = new DashboardService()
  }

  async getDashboardData(ctx: HttpContext) {
    try {
      const user = ctx.user
      if (!user) {
        return ResponseHelper.unauthorized(ctx.response, 'No autenticado')
      }

      let dashboardData
      if (user.role === 'admin') {
        dashboardData = await this.dashboardService.getAdminDashboardData()
      } else if (user.role === 'supervisor') {
        dashboardData = await this.dashboardService.getSupervisorDashboardData(user.id)
      } else {
        // Minero
        dashboardData = await this.dashboardService.getMineroDashboardData(user.id)
      }

      return ResponseHelper.success(ctx.response, 'Datos del dashboard obtenidos exitosamente', dashboardData)
    } catch (error) {
      ErrorHandler.logError(error, 'DASHBOARD_DATA')
      return ResponseHelper.error(ctx.response, error.message || 'Error al obtener datos del dashboard', 500)
    }
  }

  async getTeamsData(ctx: HttpContext) {
    try {
      const user = ctx.user
      if (!user) {
        return ResponseHelper.unauthorized(ctx.response, 'No autenticado')
      }

      let teamsData
      if (user.role === 'admin') {
        teamsData = await this.dashboardService.getAllTeamsData()
      } else if (user.role === 'supervisor') {
        teamsData = await this.dashboardService.getSupervisorTeamsData(user.id)
      } else {
        // Minero - solo su equipo
        teamsData = await this.dashboardService.getMineroTeamData(user.id)
      }

      return ResponseHelper.success(ctx.response, 'Datos de equipos obtenidos exitosamente', teamsData)
    } catch (error) {
      ErrorHandler.logError(error, 'DASHBOARD_TEAMS')
      return ResponseHelper.error(ctx.response, error.message || 'Error al obtener datos de equipos', 500)
    }
  }
} 