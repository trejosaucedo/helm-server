import Casco from '#models/casco'

export class CascoRepository {
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

  async createCasco(supervisorId: string, physicalId: string): Promise<Casco> {
    return await Casco.create({
      physicalId,
      supervisorId,
      isActive: true,
    })
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

  async isPhysicalIdAvailable(physicalId: string): Promise<boolean> {
    const casco = await this.findByPhysicalId(physicalId)
    return casco === null
  }
}
