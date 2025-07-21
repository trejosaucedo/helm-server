import Team from '#models/team'

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
    return Team.query().where('supervisorId', supervisorId).preload('mineros')
  }

  async findByTeamId(teamId: string) {
    return Team.query().where('id', teamId).first()
  }

  async getAllTeams() {
    return await Team.query().preload('mineros')
  }
}
