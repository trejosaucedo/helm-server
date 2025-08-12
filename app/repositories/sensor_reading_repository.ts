import { CreateSensorReadingDto, SensorReadingFiltersDto } from '#dtos/sensor.dto'
import {
  SensorReadingMongoService,
  SensorReadingDocument,
  SensorReadingPayload,
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

  async create(data: SensorReadingPayload): Promise<SensorReadingDocument> {
    return await this.mongoService.insertReading({
      ...data,
      receivedAt: new Date(),
    })
  }

  async createMany(readings: CreateSensorReadingDto[]): Promise<void> {
    const mongoReadings = readings.map((data) => ({
      ...data,
      location: data.location ? JSON.parse(data.location) : undefined,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      receivedAt: new Date(),
      isNormal: true,
      isAlert: false,
    }))
    await this.mongoService.insertManyReadings(mongoReadings)
  }

  async findBySensorId(sensorId: string, limit = 100): Promise<SensorReadingDocument[]> {
    return this.mongoService.getLatestReadings(sensorId, limit)
  }

  async findWithFilters(filters: SensorReadingFiltersDto): Promise<SensorReadingDocument[]> {
    const mongoFilters: Record<string, unknown> = {}
    if (filters.cascoId) mongoFilters.cascoId = filters.cascoId
    if (filters.mineroId) mongoFilters.mineroId = filters.mineroId
    if (filters.identificador) mongoFilters.identificador = filters.identificador
    if (filters.isAlert !== undefined) mongoFilters.alertsOnly = filters.isAlert
    if (filters.limit) mongoFilters.limit = filters.limit

    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 24 * 60 * 60 * 1000)
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date()
    return this.mongoService.getReadingsByDateRange(startDate, endDate, mongoFilters)
  }

  async getRecentReadings(mineroId: string, minutes = 30): Promise<SensorReadingDocument[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000)
    const now = new Date()
    return this.mongoService.getReadingsByDateRange(since, now, { mineroId })
  }

  async getSensorStats(
    sensorId: string,
    hours = 24
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
