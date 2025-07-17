import Team from '#models/team'
import TeamMiner from '#models/team_miner'

export class TeamRepository {
  constructor() {}

  /**
   * Encontrar equipo por ID de minero
   */
  async findTeamByMineroId(mineroId: string): Promise<Team | null> {
    const teamMiner = await TeamMiner.query()
      .where('mineroId', mineroId)
      .preload('equipo')
      .first()
    
    return teamMiner?.equipo || null
  }

  /**
   * Encontrar equipos por ID de supervisor
   */
  async findTeamsBySupervisorId(supervisorId: string): Promise<Team[]> {
    return Team.query()
      .where('supervisorId', supervisorId)
      .preload('mineros')
  }

  /**
   * Obtener todos los mineros de un equipo
   */
  async getTeamMiners(teamId: string): Promise<TeamMiner[]> {
    return TeamMiner.query()
      .where('equipoId', teamId)
      .preload('minero')
  }

  /**
   * Obtener el número total de mineros por equipo
   */
  async getMinersCount(teamId: string): Promise<number> {
    const result = await TeamMiner.query()
      .where('equipoId', teamId)
      .where('activo', true)
      .count('* as total')
      .first()
    
    return Number(result?.$extras.total) || 0
  }
}
