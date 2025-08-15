import Casco from '#models/casco'
import { CreateCascoDto } from '#dtos/casco.dto'
import { DateTime } from 'luxon'

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

  async findByMineroId(mineroId: string): Promise<Casco | null> {
    return await Casco.query()
      .where('minero_id', mineroId)
      .where('is_active', true)
      .preload('minero')
      .preload('sensores')
      .first()
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

  // Método actualizado: ya no crea casco, sino que vincula uno existente al supervisor o reactiva uno existente
  async activateCascoForSupervisor(
    supervisorId: string,
    physicalId: string
  ): Promise<Casco | null> {
    // Buscar el casco por su ID físico
    const casco = await this.findByPhysicalId(physicalId)
    if (!casco) return null

    // Verificar que el casco no esté vinculado a otro supervisor diferente
    if (casco.supervisorId && casco.supervisorId !== supervisorId) {
      throw new Error('Este casco ya está vinculado a otro supervisor')
    }

    // Vincular/reactivar el casco al supervisor
    casco.supervisorId = supervisorId
    casco.isActive = true
    casco.asignadoSupervisor = true
    if (!casco.fechaActivacion) {
      casco.fechaActivacion = DateTime.now()
    }
    await casco.save()

    return casco
  }

  async assignToMinero(cascoId: string, mineroId: string): Promise<Casco | null> {
    const casco = await this.findById(cascoId)
    if (!casco) return null

    casco.mineroId = mineroId
    casco.asignadoMinero = true
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

  // Método actualizado: verifica que el casco exista y no esté vinculado a otro supervisor
  async isPhysicalIdAvailableForActivation(physicalId: string, supervisorId?: string): Promise<boolean> {
    const casco = await this.findByPhysicalId(physicalId)
    if (!casco) return false
    
    // Si no tiene supervisor asignado, está disponible
    if (casco.supervisorId === null) return true
    
    // Si tiene supervisor asignado, solo está disponible si es el mismo supervisor que lo quiere activar
    return supervisorId ? casco.supervisorId === supervisorId : false
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

  async getAllCascos() {
    return await Casco.query()
      .preload('minero')
      .preload('sensores')
      .orderBy('created_at', 'desc')
  }

  async getCascosBySupervisor(supervisorId: string): Promise<Casco[]> {
    return await Casco.query()
      .where('supervisor_id', supervisorId)
      .preload('minero')
      .preload('sensores')
      .orderBy('created_at', 'desc')
  }
}
