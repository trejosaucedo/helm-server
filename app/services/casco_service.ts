import { UserRepository } from '#repositories/user_repository'
import type { CascoDto } from '#types/casco'

export class CascoService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  async getAvailableCascos(): Promise<CascoDto[]> {
    const assignedCascos = await this.userRepository.getAllAssignedCascos()

    const allCascos = this.getAllSystemCascos()

    return allCascos.map((casco) => ({
      id: casco,
      isAvailable: !assignedCascos.includes(casco),
      assignedUserId: undefined,
    }))
  }

  async isCascoAvailable(cascoId: string): Promise<boolean> {
    const existingUser = await this.userRepository.findByCascoId(cascoId)
    return existingUser === null
  }

  async assignCasco(cascoId: string, userId: string): Promise<void> {
    const isAvailable = await this.isCascoAvailable(cascoId)
    if (!isAvailable) {
      throw new Error('El casco no está disponible')
    }

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    await this.userRepository.updateMinero({
      id: user.id,
      cascoId,
    })
  }

  private getAllSystemCascos(): string[] {
    return [
      'CASCO001',
      'CASCO002',
      'CASCO003',
      'CASCO004',
      'CASCO005',
      'CASCO006',
      'CASCO007',
      'CASCO008',
      'CASCO009',
      'CASCO010',
      'CASCO011',
      'CASCO012',
      'CASCO013',
      'CASCO014',
      'CASCO015',
      'CASCO016',
      'CASCO017',
      'CASCO018',
      'CASCO019',
      'CASCO020',
    ]
  }
}
