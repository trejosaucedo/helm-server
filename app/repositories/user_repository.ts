import User from '#models/user'
import { UpdateMineroData, UpdateSupervisorData } from '#types/user'
import { RegisterMineroDto, RegisterSupervisorDto } from '#dtos/user.dto'

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return await User.findBy('email', email)
  }

  async findById(id: string): Promise<User | null> {
    return await User.find(id)
  }

  async findByCascoId(cascoId: string): Promise<User | null> {
    return await User.findBy('casco_id', cascoId)
  }

  async updateMinero(data: UpdateMineroData): Promise<User | null> {
    const user = await this.findById(data.id)
    if (!user) {
      return null
    }

    user.fullName = data.fullName ?? user.fullName
    user.email = data.email ?? user.email
    user.cascoId = data.cascoId ?? user.cascoId

    await user.save()
    return user
  }

  async update(data: UpdateSupervisorData): Promise<User | null> {
    const user = await this.findById(data.id)
    if (!user) {
      return null
    }

    user.fullName = data.fullName ?? user.fullName
    user.email = data.email ?? user.email

    await user.save()
    return user
  }

  async createMinero(data: RegisterMineroDto & { password: string }): Promise<User> {
    return await User.create({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: 'minero',
      cascoId: data.cascoId,
    })
  }

  async createSupervisor(data: RegisterSupervisorDto): Promise<User> {
    return await User.create({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: 'supervisor',
    })
  }

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email)
    return user !== null
  }

  async cascoIdExists(cascoId: string): Promise<boolean> {
    const user = await this.findByCascoId(cascoId)
    return user !== null
  }

  async getAllUsers(): Promise<User[]> {
    return await User.all()
  }

  async getUsersByRole(role: 'supervisor' | 'minero'): Promise<User[]> {
    return await User.query().where('role', role)
  }

  async getMinerosBySupervisor(supervisorId: string): Promise<User[]> {
    // Obtiene los mineros que tienen cascos asignados por este supervisor
    return await User.query()
      .where('role', 'minero')
      .whereHas('cascos', (query) => {
        query.where('supervisor_id', supervisorId)
      })
  }
}
