import Casco from '#models/casco'
import { CreateCascoDto } from '#dtos/casco.dto'

export class CascoRepository {
  /*
  async create(data: CreateCascoDto) {

  }
  */
  async findById(id: string): Promise<Casco | null> {
    return await Casco.find(id)
  }

  async findByPhysicalId(physicalId: string): Promise<Casco | null> {
    return await Casco.findBy('physical_id', physicalId)
  }

  async findBySupervisorId(supervisorId: string): Promise<Casco[]> {
    return Casco.query()
      .where('supervisor_id', supervisorId)
      .preload('minero')
      .orderBy('created_at', 'desc')
  }

  async findAvailableBySupervisor(supervisorId: string): Promise<Casco[]> {
    return Casco.query()
      .where('supervisor_id', supervisorId)
      .where('is_active', true)
      .whereNull('minero_id')
  }

  // Método actualizado: ya no crea casco, sino que vincula uno existente al supervisor
  async activateCascoForSupervisor(
    supervisorId: string,
    physicalId: string
  ): Promise<Casco | null> {
    // Buscar el casco por su ID físico
    const casco = await this.findByPhysicalId(physicalId)
    if (!casco) return null

    // Verificar que el casco no esté ya vinculado a otro supervisor
    if (casco.supervisorId) {
      throw new Error('Este casco ya está vinculado a otro supervisor')
    }

    // Vincular el casco al supervisor y activarlo
    casco.supervisorId = supervisorId
    casco.isActive = true
    await casco.save()

    return casco
  }

  async assignToMinero(cascoId: string, mineroId: string): Promise<Casco | null> {
    const casco = await this.findById(cascoId)
    if (!casco) return null

    casco.mineroId = mineroId
    await casco.save()
    return casco
  }

  async unassignFromMinero(cascoId: string): Promise<Casco | null> {
    const casco = await this.findById(cascoId)
    if (!casco) return null

    casco.mineroId = null
    await casco.save()
    return casco
  }

  async deactivateCasco(cascoId: string): Promise<Casco | null> {
    const casco = await this.findById(cascoId)
    if (!casco) return null

    casco.isActive = false
    casco.mineroId = null
    await casco.save()
    return casco
  }

  // Método actualizado: verifica que el casco exista y no esté vinculado a ningún supervisor
  async isPhysicalIdAvailableForActivation(physicalId: string): Promise<boolean> {
    const casco = await this.findByPhysicalId(physicalId)
    // El casco debe existir pero no estar vinculado a ningún supervisor
    return casco !== null && casco.supervisorId === null
  }

  // Método para verificar si un casco físico existe en el sistema
  async cascoExistsByPhysicalId(physicalId: string): Promise<boolean> {
    const casco = await this.findByPhysicalId(physicalId)
    return casco !== null
  }

  async createCasco(data: CreateCascoDto): Promise<Casco> {
    return await Casco.create({
      serial: data.serial,
      physicalId: data.physicalId,
      supervisorId: data.supervisorId ?? null,
      isActive: true,
    })
  }

  async findAll(): Promise<Casco[]> {
    return await Casco.all()
  }
}
