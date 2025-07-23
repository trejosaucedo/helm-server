import { SensorRepository } from '#repositories/sensor_repository'
import { SensorReadingRepository } from '#repositories/sensor_reading_repository'
import { NotificationService } from '#services/notification_service'
import type {
  CreateSensorReadingDto,
  SensorReadingFiltersDto,
  SensorStatsDto,
} from '#dtos/sensor.dto'
import type {
  SensorReadingDocument,
  SensorReadingPayload,
} from '#services/sensor_reading_mongo_service'
// @ts-ignore
import { wsService } from '#start/ws'
import { SensorRecentReadingsRepository } from '#repositories/sensor_recent_readings_repository'

type PublishSensorDataInput = {
  cascoId: string
  sensorId: string
  data: any
  deviceToken: string
}

export class SensorReadingService {
  private sensorRepository: SensorRepository
  private readingRepository: SensorReadingRepository
  private notificationService: NotificationService

  constructor() {
    this.sensorRepository = new SensorRepository()
    this.readingRepository = new SensorReadingRepository()
    this.notificationService = new NotificationService()
  }

  async connect(): Promise<void> {
    await this.readingRepository.connect()
  }
  async disconnect(): Promise<void> {
    await this.readingRepository.disconnect()
  }

  async ingestReading(data: CreateSensorReadingDto): Promise<SensorReadingDocument> {
    await this.connect()
    try {
      const sensor = await this.sensorRepository.findById(data.sensorId)
      if (!sensor) throw new Error('Sensor no encontrado')

      const isNormal = this.isReadingNormal(data.value, sensor)
      const isAlert = !isNormal && this.isReadingAlert(data.value, sensor)

      // Parsear location si viene como string JSON
      let locationObj: { latitude: number; longitude: number; accuracy?: number } | undefined
      if (typeof data.location === 'string') {
        try {
          locationObj = JSON.parse(data.location)
        } catch {
          locationObj = undefined
        }
      }

      const payload: SensorReadingPayload = {
        sensorId: data.sensorId,
        cascoId: data.cascoId,
        mineroId: data.mineroId,
        value: data.value,
        unit: data.unit,
        isNormal,
        isAlert,
        batteryLevel: data.batteryLevel,
        signalStrength: data.signalStrength,
        location: locationObj,
        metadata: data.metadata,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      }

      const reading = await this.readingRepository.create(payload)

      await SensorRecentReadingsRepository.addRecentReading(
        data.sensorId,
        {
          ...payload,
          timestamp: payload.timestamp,
        },
        5
      )

      // Generar alerta si es necesario
      if (isAlert && reading.mineroId && sensor.alertThreshold !== null) {
        await this.notificationService.createSensorAlert({
          userId: reading.mineroId,
          sensorType: sensor.type,
          sensorName: sensor.name,
          value: reading.value,
          unit: reading.unit,
          threshold: sensor.alertThreshold,
          cascoId: reading.cascoId,
          location: reading.location ? JSON.stringify(reading.location) : undefined,
        })
      }
      
      return reading
    } finally {
      await this.disconnect()
    }
  }

  async ingestBatchReadings(readings: CreateSensorReadingDto[]): Promise<SensorReadingDocument[]> {
    await this.connect()
    try {
      const results: SensorReadingDocument[] = []
      for (const data of readings) {
        try {
          const reading = await this.ingestReading(data)
          results.push(reading)
        } catch (error) {
          console.error('Error procesando lectura:', error)
        }
      }
      return results
    } finally {
      await this.disconnect()
    }
  }

  async getSensorReadings(sensorId: string, limit = 10): Promise<SensorReadingDocument[]> {
    await this.connect()
    try {
      return await this.readingRepository.findBySensorId(sensorId, limit)
    } finally {
      await this.disconnect()
    }
  }

  async getRecentReadingsRedis(sensorId: string): Promise<any[]> {
    return SensorRecentReadingsRepository.getRecentReadings(sensorId)
  }

  async getReadings(filters: SensorReadingFiltersDto): Promise<SensorReadingDocument[]> {
    await this.connect()
    try {
      return await this.readingRepository.findWithFilters(filters)
    } finally {
      await this.disconnect()
    }
  }

  async getRecentReadings(mineroId: string, minutes = 30): Promise<SensorReadingDocument[]> {
    await this.connect()
    try {
      return await this.readingRepository.getRecentReadings(mineroId, minutes)
    } finally {
      await this.disconnect()
    }
  }

  async getSensorStats(sensorId: string, hours = 24): Promise<SensorStatsDto> {
    await this.connect()
    try {
      const stats = await this.readingRepository.getSensorStats(sensorId, hours)
      return {
        sensorId,
        avgValue: stats.avgValue,
        minValue: stats.minValue,
        maxValue: stats.maxValue,
        readingCount: stats.readingCount,
        alertCount: stats.alertCount,
        lastReading: new Date().toISOString(),
        trend: 'stable',
      }
    } finally {
      await this.disconnect()
    }
  }

  private isReadingNormal(value: number, sensor: any): boolean {
    if (sensor.type === 'gps') return true
    if (sensor.minValue !== null && value < sensor.minValue) return false
    if (sensor.maxValue !== null && value > sensor.maxValue) return false
    return true
  }

  private isReadingAlert(value: number, sensor: any): boolean {
    if (sensor.alertThreshold === null) return false
    return (
      ['heart_rate', 'body_temperature', 'gas'].includes(sensor.type) &&
      value > sensor.alertThreshold
    )
  }

  async publishSensorData(input: PublishSensorDataInput): Promise<void> {
    const { cascoId, sensorId, data } = input

    // 🚨 Validar que mineroId exista y sea string
    if (!data.mineroId || typeof data.mineroId !== 'string' || !data.mineroId.trim()) {
      throw new Error('mineroId es obligatorio y debe ser un string no vacío')
    }

    // Obtén el sensor para validar ranges y unit, si lo necesitas
    const sensor = await this.sensorRepository.findById(sensorId)
    if (!sensor) throw new Error('Sensor no encontrado')

    // Normalizar datos
    const locationObj =
      typeof data.location === 'string'
        ? (() => {
            try {
              return JSON.parse(data.location)
            } catch {
              return undefined
            }
          })()
        : data.location

    const readingPayload: CreateSensorReadingDto = {
      sensorId,
      cascoId,
      mineroId: data.mineroId,
      value: data.value,
      unit: data.unit || sensor.unit,
      batteryLevel: data.batteryLevel,
      signalStrength: data.signalStrength,
      location: locationObj ? JSON.stringify(locationObj) : undefined,
      metadata: data.metadata,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    }

    // Guardar la lectura usando el método principal
    await this.ingestReading(readingPayload)
  }
}
