import Sensor from '#models/sensor'
import { CreateSensorDto, UpdateSensorDto } from '#dtos/sensor.dto'

export class SensorRepository {
  async findById(id: string): Promise<Sensor | null> {
    return await Sensor.find(id)
  }

  async findByCascoId(cascoId: string): Promise<Sensor[]> {
    return await Sensor.query()
      .where('casco_id', cascoId)
      .orderBy('type')
  }

  async findByType(type: 'gps' | 'heart_rate' | 'body_temperature' | 'gas'): Promise<Sensor[]> {
    return await Sensor.query()
      .where('type', type)
      .where('is_active', true)
  }

  async create(data: CreateSensorDto): Promise<Sensor> {
    return await Sensor.create({
      cascoId: data.cascoId,
      type: data.type,
      name: data.name,
      minValue: data.minValue || null,
      maxValue: data.maxValue || null,
      unit: data.unit,
      sampleRate: data.sampleRate || 60,
      alertThreshold: data.alertThreshold || null,
      isActive: true,
    })
  }

  async update(id: string, data: UpdateSensorDto): Promise<Sensor | null> {
    const sensor = await this.findById(id)
    if (!sensor) return null

    sensor.merge({
      name: data.name ?? sensor.name,
      minValue: data.minValue ?? sensor.minValue,
      maxValue: data.maxValue ?? sensor.maxValue,
      unit: data.unit ?? sensor.unit,
      sampleRate: data.sampleRate ?? sensor.sampleRate,
      alertThreshold: data.alertThreshold ?? sensor.alertThreshold,
      isActive: data.isActive ?? sensor.isActive,
    })

    await sensor.save()
    return sensor
  }

  async delete(id: string): Promise<boolean> {
    const sensor = await this.findById(id)
    if (!sensor) return false

    await sensor.delete()
    return true
  }

  async deactivate(id: string): Promise<boolean> {
    const sensor = await this.findById(id)
    if (!sensor) return false

    sensor.isActive = false
    await sensor.save()
    return true
  }

  async activate(id: string): Promise<boolean> {
    const sensor = await this.findById(id)
    if (!sensor) return false

    sensor.isActive = true
    await sensor.save()
    return true
  }

  async getActiveSensorsByCasco(cascoId: string): Promise<Sensor[]> {
    return await Sensor.query()
      .where('casco_id', cascoId)
      .where('is_active', true)
      .orderBy('type')
  }

  async getSensorsByMinero(mineroId: string): Promise<Sensor[]> {
    return await Sensor.query()
      .whereHas('casco', (query) => {
        query.where('minero_id', mineroId)
      })
      .where('is_active', true)
      .preload('casco')
  }

  async getSensorsBySupervisor(supervisorId: string): Promise<Sensor[]> {
    return await Sensor.query()
      .whereHas('casco', (query) => {
        query.where('supervisor_id', supervisorId)
      })
      .where('is_active', true)
      .preload('casco')
  }

  /**
   * Buscar sensores por minero (a través del casco asignado)
   */
  async findByMineroId(mineroId: string): Promise<Sensor[]> {
    return await Sensor.query()
      .whereHas('casco', (query) => {
        query.where('minero_id', mineroId)
      })
      .preload('casco')
  }
}
