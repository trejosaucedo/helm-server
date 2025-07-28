import { TeamRepository } from '#repositories/team_repository'
import { UserRepository } from '#repositories/user_repository'
import { CascoRepository } from '#repositories/casco_repository'
import db from '@adonisjs/lucid/services/db'

export interface DashboardStats {
  totalTeams: number
  totalHelmets: number
  activeHelmets: number
  totalAlerts: number
  totalSupervisors: number
  helmetsWithSupervisor: number
  helmetsWithoutMiner: number
  totalMiners: number
  activeMiners: number
}

export interface TeamData {
  id: string
  name: string
  location: string
  status: 'active' | 'inactive' | 'warning'
  totalHelmets: number
  activeHelmets: number
  alerts: number
  miners: Array<{
    id: string
    name: string
    avatar: string
    status: 'online' | 'offline' | 'alert'
  }>
  lastUpdate: string
}

export class DashboardService {
  private teamRepository: TeamRepository
  private userRepository: UserRepository
  private cascoRepository: CascoRepository

  constructor() {
    this.teamRepository = new TeamRepository()
    this.userRepository = new UserRepository()
    this.cascoRepository = new CascoRepository()
  }

  async getAdminDashboardData(): Promise<DashboardStats> {
    // Obtener estadísticas generales del sistema
    const [teams, helmets, supervisors, miners] = await Promise.all([
      this.teamRepository.getAllTeams(),
      this.cascoRepository.getAllCascos(),
      this.userRepository.getUsersByRole('supervisor'),
      this.userRepository.getUsersByRole('minero')
    ])

    const activeHelmets = helmets.filter(h => h.isActive).length
    const helmetsWithSupervisor = helmets.filter(h => h.supervisorId).length
    const helmetsWithoutMiner = helmets.filter(h => !h.mineroId).length

    // Simular alertas (en un sistema real vendría de sensores)
    const totalAlerts = Math.floor(Math.random() * 20) + 5

    return {
      totalTeams: teams.length,
      totalHelmets: helmets.length,
      activeHelmets,
      totalAlerts,
      totalSupervisors: supervisors.length,
      helmetsWithSupervisor,
      helmetsWithoutMiner,
      totalMiners: miners.length,
      activeMiners: Math.floor(miners.length * 0.8) // Simular mineros activos
    }
  }

  async getSupervisorDashboardData(supervisorId: string): Promise<DashboardStats> {
    // Obtener datos específicos del supervisor
    const [teams, helmets, miners] = await Promise.all([
      this.teamRepository.findTeamsBySupervisorId(supervisorId),
      this.cascoRepository.getCascosBySupervisor(supervisorId),
      this.userRepository.getMinerosBySupervisor(supervisorId)
    ])

    const activeHelmets = helmets.filter(h => h.isActive).length
    const helmetsWithSupervisor = helmets.filter(h => h.supervisorId).length
    const helmetsWithoutMiner = helmets.filter(h => !h.mineroId).length

    // Simular alertas para equipos del supervisor
    const totalAlerts = Math.floor(Math.random() * 10) + 2

    return {
      totalTeams: teams.length,
      totalHelmets: helmets.length,
      activeHelmets,
      totalAlerts,
      totalSupervisors: 1, // Solo el supervisor actual
      helmetsWithSupervisor,
      helmetsWithoutMiner,
      totalMiners: miners.length,
      activeMiners: Math.floor(miners.length * 0.8)
    }
  }

  async getMineroDashboardData(mineroId: string): Promise<DashboardStats> {
    // Obtener datos específicos del minero
    const minero = await this.userRepository.findById(mineroId)
    if (!minero) {
      throw new Error('Minero no encontrado')
    }

    const helmet = minero.cascoId ? await this.cascoRepository.findById(minero.cascoId) : null

    return {
      totalTeams: 1,
      totalHelmets: helmet ? 1 : 0,
      activeHelmets: helmet?.isActive ? 1 : 0,
      totalAlerts: Math.floor(Math.random() * 3),
      totalSupervisors: 1,
      helmetsWithSupervisor: helmet?.supervisorId ? 1 : 0,
      helmetsWithoutMiner: 0,
      totalMiners: 1,
      activeMiners: 1
    }
  }

  async getAllTeamsData(): Promise<TeamData[]> {
    const teams = await this.teamRepository.getAllTeams()
    return await this.mapTeamsToDashboardData(teams)
  }

  async getSupervisorTeamsData(supervisorId: string): Promise<TeamData[]> {
    const teams = await this.teamRepository.findTeamsBySupervisorId(supervisorId)
    return await this.mapTeamsToDashboardData(teams)
  }

  async getMineroTeamData(mineroId: string): Promise<TeamData[]> {
    // Obtener el equipo del minero
    const minero = await this.userRepository.findById(mineroId)
    if (!minero) {
      throw new Error('Minero no encontrado')
    }

    // Buscar el equipo donde está asignado el minero
    const teamMiner = await db.from('team_miners')
      .where('minero_id', mineroId)
      .where('activo', true)
      .first()

    if (!teamMiner) {
      return []
    }

    const team = await this.teamRepository.findById(teamMiner.equipo_id)
    if (!team) {
      return []
    }

    return await this.mapTeamsToDashboardData([team])
  }

  private async mapTeamsToDashboardData(teams: any[]): Promise<TeamData[]> {
    const teamsData: TeamData[] = []

    for (const team of teams) {
      // Obtener cascos del equipo (simulado - en realidad vendría de la relación equipo-casco)
      const helmets = await this.cascoRepository.getAllCascos()
      const teamHelmets = helmets.slice(0, Math.floor(Math.random() * 20) + 10) // Simular cascos por equipo
      
      const activeHelmets = teamHelmets.filter(h => h.isActive).length
      const totalHelmets = teamHelmets.length
      
      // Determinar estado del equipo
      let status: 'active' | 'inactive' | 'warning' = 'active'
      if (activeHelmets / totalHelmets < 0.5) {
        status = 'inactive'
      } else if (activeHelmets / totalHelmets < 0.8) {
        status = 'warning'
      }

      // Obtener mineros del equipo usando el modelo TeamMiner
      const teamMiners = await db.from('team_miners')
        .where('equipo_id', team.id)
        .where('activo', true)
        .select('*')

      // Obtener los datos de los mineros
      const miners = []
      for (const tm of teamMiners) {
        const minero = await this.userRepository.findById(tm.minero_id)
        if (minero) {
          miners.push({
            id: minero.id,
            name: minero.fullName || 'Sin nombre',
            avatar: (minero.fullName || 'NN').substring(0, 2).toUpperCase(),
            status: Math.random() > 0.2 ? 'online' : (Math.random() > 0.5 ? 'alert' : 'offline') as 'online' | 'offline' | 'alert'
          })
        }
      }

      // Simular alertas
      const alerts = Math.floor(Math.random() * 5)
      
      // Simular última actualización
      const lastUpdate = `${Math.floor(Math.random() * 15) + 1} min`

      teamsData.push({
        id: team.id,
        name: team.nombre,
        location: team.zona,
        status,
        totalHelmets,
        activeHelmets,
        alerts,
        miners,
        lastUpdate
      })
    }

    return teamsData
  }
} 