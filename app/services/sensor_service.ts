import { SensorRepository } from '#repositories/sensor_repository'
import type { CreateSensorDto, UpdateSensorDto, SensorResponseDto } from '#dtos/sensor.dto'
import Sensor from '#models/sensor'
import { CascoService } from '#services/casco_service'

export class SensorService {
  private sensorRepository: SensorRepository
  private cascoService: CascoService

  constructor() {
    this.sensorRepository = new SensorRepository()
    this.cascoService = new CascoService()
  }

  async createSensor(data: CreateSensorDto): Promise<SensorResponseDto> {
    const sensor = await this.sensorRepository.create(data)
    return this.mapSensorToResponse(sensor)
  }

  async updateSensor(id: string, data: UpdateSensorDto): Promise<SensorResponseDto | null> {
    const sensor = await this.sensorRepository.update(id, data)
    return sensor ? this.mapSensorToResponse(sensor) : null
  }

  async getSensorsByCasco(cascoId: string): Promise<SensorResponseDto[]> {
    const sensors = await this.sensorRepository.findByCascoId(cascoId)
    return sensors.map(this.mapSensorToResponse)
  }

  async getSensorsByMinero(mineroId: string): Promise<SensorResponseDto[]> {
    const sensors = await this.sensorRepository.findByMineroId(mineroId)
    return sensors.map(this.mapSensorToResponse)
  }

  async activateSensor(id: string): Promise<boolean> {
    return this.sensorRepository.activate(id)
  }

  async deactivateSensor(id: string): Promise<boolean> {
    return this.sensorRepository.deactivate(id)
  }

  async validateSensorInCasco(
    sensorId: string,
    cascoId: string
  ): Promise<{ isValid: boolean; message: string }> {
    const sensor = await this.sensorRepository.findById(sensorId)
    if (!sensor) return { isValid: false, message: `Sensor ${sensorId} no encontrado` }
    if (sensor.cascoId !== cascoId)
      return { isValid: false, message: `Sensor ${sensorId} no pertenece al casco ${cascoId}` }
    if (!sensor.isActive) return { isValid: false, message: `Sensor ${sensorId} está inactivo` }
    return { isValid: true, message: 'Sensor válido' }
  }
  async validateCascoExists(cascoId: string): Promise<boolean> {
    return this.cascoService.exists(cascoId)
  }

  private mapSensorToResponse(sensor: Sensor): SensorResponseDto {
    return {
      id: sensor.id,
      cascoId: sensor.cascoId,
      type: sensor.type,
      name: sensor.name,
      isActive: sensor.isActive,
      minValue: sensor.minValue,
      maxValue: sensor.maxValue,
      unit: sensor.unit,
      sampleRate: sensor.sampleRate,
      alertThreshold: sensor.alertThreshold,
      createdAt: sensor.createdAt?.toISO() || new Date().toISOString(),
      updatedAt: sensor.updatedAt?.toISO() || null,
    }
  }
}
