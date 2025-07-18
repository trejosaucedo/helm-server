import { TeamRepository } from '#repositories/team_repository'
import { UserRepository } from '#repositories/user_repository'
import Team from '#models/team'
import TeamMiner from '#models/team_miner'
import {
  CreateTeamDto,
  AssignMinerDto,
  TeamResponseDto,
  TeamMinerResponseDto,
} from '#dtos/team.dto'

export class TeamService {
  private teamRepository: TeamRepository
  private userRepository: UserRepository

  constructor() {
    this.teamRepository = new TeamRepository()
    this.userRepository = new UserRepository()
  }

  async createTeam(data: CreateTeamDto): Promise<TeamResponseDto> {
    const { supervisorId, nombre, zona } = data

    const supervisor = await this.userRepository.findById(supervisorId)
    if (!supervisor || supervisor.role !== 'supervisor') {
      throw new Error('Supervisor no encontrado o no tiene el rol adecuado')
    }

    const team = await this.teamRepository.create({ supervisorId, nombre, zona })

    return this.mapTeamToResponse(team)
  }

  async assignMinerToTeam(data: AssignMinerDto): Promise<TeamResponseDto> {
    const { teamId, mineroId } = data

    const minero = await this.userRepository.findById(mineroId)
    if (!minero || minero.role !== 'minero') {
      throw new Error('El minero no encontrado o no tiene el rol adecuado')
    }

    const team = await this.teamRepository.findById(teamId)
    if (!team) {
      throw new Error('El equipo no encontrado')
    }

    await TeamMiner.create({
      equipoId: teamId,
      mineroId,
      activo: true,
    })

    return this.mapTeamToResponse(team)
  }

  async getTeamsBySupervisor(supervisorId: string): Promise<TeamResponseDto[]> {
    const teams = await this.teamRepository.findTeamsBySupervisorId(supervisorId)
    return teams.map((team) => this.mapTeamToResponse(team))
  }

  async getTeamMiners(teamId: string): Promise<TeamMinerResponseDto[]> {
    // Obtener el equipo usando el teamId
    const team = await this.teamRepository.findById(teamId)
    if (!team) {
      throw new Error('El equipo no existe')
    }

    // Pre-cargar todos los mineros asociados al equipo
    await team.load('mineros')

    return team.mineros
      .filter((minero) => minero.activo)
      .map((minero) => ({
        id: minero.id,
        nombre: minero.minero.fullName ?? 'Sin nombre',
        zona: team.zona,
        fechaAsignacion: minero.fechaAsignacion?.toISO() || '',
        fechaSalida: minero.fechaSalida?.toISO() || null,
      }))
  }

  private mapTeamToResponse(team: Team): TeamResponseDto {
    return {
      id: team.id,
      nombre: team.nombre,
      zona: team.zona,
      supervisorId: team.supervisorId,
      createdAt: team.createdAt.toISO() || '',
      updatedAt: team.updatedAt?.toISO() || '',
    }
  }
}
