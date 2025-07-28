import User from '#models/user'
import {
  RegisterMineroDto,
  RegisterSupervisorDto,
  UpdateSupervisorDto,
  UpdateMineroDto,
} from '#dtos/user.dto'

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

  async updateMinero(data: UpdateMineroDto): Promise<User | null> {
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

  async update(data: UpdateSupervisorDto): Promise<User | null> {
    const user = await this.findById(data.id)
    if (!user) {
      return null
    }

    user.fullName = data.fullName ?? user.fullName
    user.email = data.email ?? user.email

    await user.save()
    return user
  }

  async updatePassword(userId: string, newPassword: string) {
    const user = await User.findOrFail(userId)
    user.password = newPassword
    await user.save()
  }

  async createMinero(data: RegisterMineroDto & { password: string }): Promise<User> {
    return await User.create({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: 'minero',
      cascoId: data.cascoId,
      birthDate: data.birthDate ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      rfc: data.rfc ?? null,
      fechaContratacion: data.fechaContratacion ?? null,
      especialidadEnMineria: data.especialidadEnMineria ?? null,
      genero: data.genero ?? null,
      supervisorId: data.supervisorId ?? null,
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
    // Obtiene los mineros que están asignados a este supervisor
    return await User.query()
      .where('role', 'minero')
      .where('supervisorId', supervisorId)
  }
}
