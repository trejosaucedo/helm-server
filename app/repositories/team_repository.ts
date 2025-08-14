import Team from '#models/team'
import TeamMiner from '#models/team_miner'

export class TeamRepository {
  async create(data: { supervisorId: string; nombre: string; zona: string }) {
    return await Team.create(data)
  }

  async findById(id: string) {
    return await Team.query()
      .where('id', id)
      .preload('mineros', (query) => {
        query.preload('minero')
      })
      .first();
  }

  async findTeamsBySupervisorId(supervisorId: string) {
    return Team.query()
      .where('supervisorId', supervisorId)
      .preload('mineros', (query) => {
        query.preload('minero')
      })
  }

  async findByTeamId(teamId: string) {
    return Team.query().where('id', teamId).first()
  }

  async getAllTeams() {
    return await Team.query().preload('mineros', (query) => {
      query.preload('minero')
    })
  }

  async update(id: string, data: { nombre?: string; zona?: string; supervisorId?: string }) {
    const team = await Team.find(id)
    if (!team) return null
    team.nombre = data.nombre ?? team.nombre
    team.zona = data.zona ?? team.zona
    team.supervisorId = data.supervisorId ?? team.supervisorId
    await team.save()
    return team
  }

  async delete(id: string) {
    const team = await Team.find(id)
    if (!team) return false
    // Eliminar relaciones de mineros si existen
    await TeamMiner.query().where('equipo_id', id).delete()
    await team.delete()
    return true
  }
}
