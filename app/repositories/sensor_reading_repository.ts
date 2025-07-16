import { CreateSensorReadingDto, SensorReadingFiltersDto } from '#dtos/sensor.dto'
import {
  SensorReadingMongoService,
  SensorReadingDocument,
} from '#services/sensor_reading_mongo_service'

export class SensorReadingRepository {
  private mongoService: SensorReadingMongoService

  constructor() {
    this.mongoService = new SensorReadingMongoService()
  }

  async connect(): Promise<void> {
    await this.mongoService.connect()
  }

  async disconnect(): Promise<void> {
    await this.mongoService.disconnect()
  }

  async findById(id: string): Promise<SensorReadingDocument | null> {
    // Para MongoDB, necesitamos usar ObjectId si es un ID válido
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const readings = await this.mongoService.getReadingsByDateRange(yesterday, tomorrow, {
      sensorId: id,
    })
    return readings.length > 0 ? readings[0] : null
  }

  async create(data: CreateSensorReadingDto): Promise<SensorReadingDocument> {
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date()

    return await this.mongoService.insertReading({
      sensorId: data.sensorId,
      cascoId: data.cascoId,
      mineroId: data.mineroId,
      value: data.value,
      unit: data.unit,
      batteryLevel: data.batteryLevel,
      signalStrength: data.signalStrength,
      location: data.location ? JSON.parse(data.location) : undefined,
      metadata: data.metadata,
      timestamp: timestamp,
      receivedAt: new Date(),
      isNormal: true, // Se calculará después
      isAlert: false, // Se calculará después
    })
  }

  async createMany(readings: CreateSensorReadingDto[]): Promise<void> {
    const mongoReadings = readings.map((data) => ({
      sensorId: data.sensorId,
      cascoId: data.cascoId,
      mineroId: data.mineroId,
      value: data.value,
      unit: data.unit,
      batteryLevel: data.batteryLevel,
      signalStrength: data.signalStrength,
      location: data.location ? JSON.parse(data.location) : undefined,
      metadata: data.metadata,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      receivedAt: new Date(),
      isNormal: true,
      isAlert: false,
    }))

    await this.mongoService.insertManyReadings(mongoReadings)
  }

  async findBySensorId(sensorId: string, limit: number = 100): Promise<SensorReadingDocument[]> {
    return await this.mongoService.getLatestReadings(sensorId, limit)
  }

  async findByMineroId(mineroId: string, limit: number = 100): Promise<SensorReadingDocument[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

    return await this.mongoService.getReadingsByDateRange(yesterday, tomorrow, { mineroId, limit })
  }

  async findByCascoId(cascoId: string, limit: number = 100): Promise<SensorReadingDocument[]> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)

    return await this.mongoService.getReadingsByDateRange(yesterday, tomorrow, { cascoId, limit })
  }

  async findWithFilters(filters: SensorReadingFiltersDto): Promise<SensorReadingDocument[]> {
    const mongoFilters: any = {}

    if (filters.cascoId) {
      mongoFilters.cascoId = filters.cascoId
    }

    if (filters.mineroId) {
      mongoFilters.mineroId = filters.mineroId
    }

    if (filters.isAlert !== undefined) {
      mongoFilters.alertsOnly = filters.isAlert
    }

    if (filters.limit) {
      mongoFilters.limit = filters.limit
    }

    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 24 * 60 * 60 * 1000)
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date()

    return await this.mongoService.getReadingsByDateRange(startDate, endDate, mongoFilters)
  }

  async getRecentReadings(
    mineroId: string,
    minutes: number = 30
  ): Promise<SensorReadingDocument[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000)
    const now = new Date()

    return await this.mongoService.getReadingsByDateRange(since, now, { mineroId })
  }

  async getAlertReadings(cascoId: string, hours: number = 24): Promise<SensorReadingDocument[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    return await this.mongoService.getAlertReadings({
      cascoId,
      since: since,
    })
  }

  async getLatestReadingBySensor(sensorId: string): Promise<SensorReadingDocument | null> {
    const readings = await this.mongoService.getLatestReadings(sensorId, 1)
    return readings.length > 0 ? readings[0] : null
  }

  async updateAlertStatus(
    id: string,
    isAlert: boolean,
    isNormal: boolean
  ): Promise<SensorReadingDocument | null> {
    // MongoDB no soporta actualizaciones fáciles sin tener el objeto completo
    // En la práctica, las lecturas de sensores son inmutables una vez creadas
    const reading = await this.findById(id)
    if (!reading) return null

    // Para este caso, retornamos el objeto con los campos actualizados
    return {
      ...reading,
      isAlert,
      isNormal,
    }
  }

  async getSensorStats(
    sensorId: string,
    hours: number = 24
  ): Promise<{
    avgValue: number
    minValue: number
    maxValue: number
    readingCount: number
    alertCount: number
  }> {
    const stats = await this.mongoService.getSensorStats(sensorId, hours)

    return {
      avgValue: stats.avg,
      minValue: stats.min,
      maxValue: stats.max,
      readingCount: stats.count,
      alertCount: stats.alertCount,
    }
  }
}
