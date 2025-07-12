import SensorReading from '#models/sensor_reading'
import { CreateSensorReadingDto, SensorReadingFiltersDto } from '#dtos/sensor.dto'
import { DateTime } from 'luxon'

export class SensorReadingRepository {
  async findById(id: string): Promise<SensorReading | null> {
    return await SensorReading.find(id)
  }

  async create(data: CreateSensorReadingDto): Promise<SensorReading> {
    const timestamp = data.timestamp ? DateTime.fromISO(data.timestamp) : DateTime.now()
    
    return await SensorReading.create({
      sensorId: data.sensorId,
      cascoId: data.cascoId,
      mineroId: data.mineroId,
      value: data.value,
      unit: data.unit,
      batteryLevel: data.batteryLevel || null,
      signalStrength: data.signalStrength || null,
      location: data.location || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      timestamp: timestamp,
      receivedAt: DateTime.now(),
      isNormal: true, // Se calculará después
      isAlert: false, // Se calculará después
    })
  }

  async findBySensorId(sensorId: string, limit: number = 100): Promise<SensorReading[]> {
    return await SensorReading.query()
      .where('sensor_id', sensorId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .preload('sensor')
      .preload('minero')
  }

  async findByMineroId(mineroId: string, limit: number = 100): Promise<SensorReading[]> {
    return await SensorReading.query()
      .where('minero_id', mineroId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .preload('sensor')
  }

  async findByCascoId(cascoId: string, limit: number = 100): Promise<SensorReading[]> {
    return await SensorReading.query()
      .where('casco_id', cascoId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .preload('sensor')
  }

  async findWithFilters(filters: SensorReadingFiltersDto): Promise<SensorReading[]> {
    const query = SensorReading.query()

    if (filters.cascoId) {
      query.where('casco_id', filters.cascoId)
    }

    if (filters.mineroId) {
      query.where('minero_id', filters.mineroId)
    }

    if (filters.sensorType) {
      query.whereHas('sensor', (sensorQuery) => {
        sensorQuery.where('type', filters.sensorType!)
      })
    }

    if (filters.startDate) {
      query.where('timestamp', '>=', filters.startDate)
    }

    if (filters.endDate) {
      query.where('timestamp', '<=', filters.endDate)
    }

    if (filters.isAlert !== undefined) {
      query.where('is_alert', filters.isAlert)
    }

    if (filters.offset) {
      query.offset(filters.offset)
    }

    const limit = filters.limit || 100
    query.limit(limit)

    return await query
      .orderBy('timestamp', 'desc')
      .preload('sensor')
      .preload('minero')
  }

  async getRecentReadings(mineroId: string, minutes: number = 30): Promise<SensorReading[]> {
    const since = DateTime.now().minus({ minutes })
    
    return await SensorReading.query()
      .where('minero_id', mineroId)
      .where('timestamp', '>=', since.toISO())
      .orderBy('timestamp', 'desc')
      .preload('sensor')
  }

  async getAlertReadings(cascoId: string, hours: number = 24): Promise<SensorReading[]> {
    const since = DateTime.now().minus({ hours })
    
    return await SensorReading.query()
      .where('casco_id', cascoId)
      .where('is_alert', true)
      .where('timestamp', '>=', since.toISO())
      .orderBy('timestamp', 'desc')
      .preload('sensor')
      .preload('minero')
  }

  async getLatestReadingBySensor(sensorId: string): Promise<SensorReading | null> {
    return await SensorReading.query()
      .where('sensor_id', sensorId)
      .orderBy('timestamp', 'desc')
      .first()
  }

  async updateAlertStatus(id: string, isAlert: boolean, isNormal: boolean): Promise<SensorReading | null> {
    const reading = await this.findById(id)
    if (!reading) return null

    reading.isAlert = isAlert
    reading.isNormal = isNormal
    await reading.save()
    
    return reading
  }

  async getStatsForSensor(sensorId: string, hours: number = 24): Promise<{
    avgValue: number
    minValue: number
    maxValue: number
    readingCount: number
    alertCount: number
  }> {
    const since = DateTime.now().minus({ hours })
    
    const readings = await SensorReading.query()
      .where('sensor_id', sensorId)
      .where('timestamp', '>=', since.toISO())
    
    if (readings.length === 0) {
      return {
        avgValue: 0,
        minValue: 0,
        maxValue: 0,
        readingCount: 0,
        alertCount: 0
      }
    }

    const values = readings.map(r => r.value)
    const alerts = readings.filter(r => r.isAlert)

    return {
      avgValue: values.reduce((sum, val) => sum + val, 0) / values.length,
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      readingCount: readings.length,
      alertCount: alerts.length
    }
  }
}
