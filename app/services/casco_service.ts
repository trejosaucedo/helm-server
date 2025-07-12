import { CascoRepository } from '#repositories/casco_repository'
import { UserRepository } from '#repositories/user_repository'
import type {
  ActivateCascoDto,
  AssignCascoDto,
  CascoResponseDto,
  CreateCascoDto,
  DesactivateCascoDto,
  UnassignCascoDto,
} from '#dtos/casco.dto'

export class CascoService {
  private cascoRepository: CascoRepository
  private userRepository: UserRepository

  constructor() {
    this.cascoRepository = new CascoRepository()
    this.userRepository = new UserRepository()
  }

  async createCascoAdmin(data: CreateCascoDto): Promise<CascoResponseDto> {
    const casco = await this.cascoRepository.createCasco(data)
    return this.mapCascoToResponse(casco)
  }

  async activateCascoByPhysicalId(supervisorId: string, physicalId: string): Promise<CascoResponseDto> {
    // Verificar que el casco existe en el sistema
    const cascoExists = await this.cascoRepository.cascoExistsByPhysicalId(physicalId)
    if (!cascoExists) {
      throw new Error('El casco con este ID físico no existe en el sistema')
    }

    // Verificar que el casco está disponible para ser activado (no vinculado a otro supervisor)
    const isAvailable = await this.cascoRepository.isPhysicalIdAvailableForActivation(physicalId)
    if (!isAvailable) {
      throw new Error('Este casco ya está vinculado a otro supervisor')
    }

    // Activar/vincular el casco al supervisor
    const casco = await this.cascoRepository.activateCascoForSupervisor(supervisorId, physicalId)
    if (!casco) {
      throw new Error('Error al activar el casco')
    }

    return this.mapCascoToResponse(casco)
  }

  async activateCasco(data: ActivateCascoDto): Promise<CascoResponseDto> {
    return this.activateCascoByPhysicalId(data.supervisorId, data.physicalId)
  }

  async getCascosBySupervisor(supervisorId: string): Promise<CascoResponseDto[]> {
    const cascos = await this.cascoRepository.findBySupervisorId(supervisorId)
    return cascos.map((casco) => this.mapCascoToResponse(casco))
  }

  async getAvailableCascos(supervisorId: string): Promise<CascoResponseDto[]> {
    const cascos = await this.cascoRepository.findAvailableBySupervisor(supervisorId)
    return cascos.map((casco) => this.mapCascoToResponse(casco))
  }

  async assignCasco(data: AssignCascoDto): Promise<void> {
    const casco = await this.cascoRepository.findById(data.cascoId)
    if (!casco) {
      throw new Error('Casco no encontrado')
    }

    if (casco.supervisorId !== data.supervisorId) {
      throw new Error('No tienes permiso para asignar este casco')
    }

    if (casco.mineroId) {
      throw new Error('El casco ya está asignado')
    }

    if (!casco.isActive) {
      throw new Error('El casco no está activo')
    }

    const minero = await this.userRepository.findById(data.mineroId)
    if (!minero) {
      throw new Error('Minero no encontrado')
    }

    if (minero.role !== 'minero') {
      throw new Error('El usuario debe ser un minero')
    }

    await this.cascoRepository.assignToMinero(data.cascoId, data.mineroId)
  }

  async unassignCasco(data: UnassignCascoDto): Promise<void> {
    const casco = await this.cascoRepository.findById(data.cascoId)
    if (!casco) {
      throw new Error('Casco no encontrado')
    }

    if (casco.supervisorId !== data.supervisorId) {
      throw new Error('No tienes permiso para desasignar este casco')
    }

    if (!casco.mineroId) {
      throw new Error('El casco no está asignado')
    }

    await this.cascoRepository.unassignFromMinero(data.cascoId)
  }

  async deactivateCasco(data: DesactivateCascoDto): Promise<void> {
    const casco = await this.cascoRepository.findById(data.cascoId)
    if (!casco) {
      throw new Error('Casco no encontrado')
    }

    if (casco.supervisorId !== data.supervisorId) {
      throw new Error('No tienes permiso para desactivar este casco')
    }

    await this.cascoRepository.deactivateCasco(data.cascoId)
  }

  private mapCascoToResponse(casco: any): CascoResponseDto {
    return {
      id: casco.id,
      serial: casco.serial,
      physicalId: casco.physicalId,
      isActive: casco.isActive,
      supervisorId: casco.supervisorId,
      mineroId: casco.mineroId,
      asignadoSupervisor: casco.asignadoSupervisor,
      asignadoMinero: casco.asignadoMinero,
      fechaActivacion: casco.fechaActivacion?.toISO() || null,
      isAssigned: !!casco.mineroId,
      createdAt: casco.createdAt.toISO(),
      updatedAt: casco.updatedAt?.toISO() || null,
      minero: casco.minero
        ? {
            id: casco.minero.id,
            fullName: casco.minero.fullName,
            email: casco.minero.email,
          }
        : undefined,
    }
  }
}
