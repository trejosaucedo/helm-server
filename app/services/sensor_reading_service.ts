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
import { SensorRecentReadingsRepository } from '#repositories/sensor_recent_readings_repository'

type PublishSensorDataInput = {
  cascoId: string
  sensorId: string
  data: any
  deviceToken: string
}

/** Utils para logging seguro y trazabilidad */
const safeStringify = (obj: unknown): string => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return '[Unserializable object]'
  }
}
const makeTraceId = (): string => {
  try {
    // @ts-ignore - en Node18+ existe crypto.randomUUID
    return (
      (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(16).slice(2)}`
    )
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}
const log = (trace: string, ...args: unknown[]) => console.log(`[${trace}]`, ...args)
const warn = (trace: string, ...args: unknown[]) => console.warn(`[${trace}]`, ...args)
const error = (trace: string, ...args: unknown[]) => console.error(`[${trace}]`, ...args)

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
    const trace = makeTraceId()
    console.time(`[${trace}] ingestReading`)
    await this.connect()
    try {
      log(trace, '▶️ ingestReading input:', safeStringify(data))

      const sensor = await this.sensorRepository.findById(data.sensorId)
      log(trace, '🔎 sensor:', sensor ? `${sensor.name} (${sensor.type})` : null)
      if (!sensor) throw new Error('Sensor no encontrado')

      const isNormal = this.isReadingNormal(data.value, sensor)
      const isAlert = !isNormal && this.isReadingAlert(data.value, sensor)
      log(trace, `🧪 flags -> isNormal: ${isNormal} | isAlert: ${isAlert}`)

      // Parsear location si viene como string JSON
      let locationObj: { latitude: number; longitude: number; accuracy?: number } | undefined
      if (typeof data.location === 'string') {
        try {
          locationObj = JSON.parse(data.location)
        } catch {
          warn(trace, '⚠️ location no JSON parseable:', data.location)
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

      log(trace, '📦 payload a guardar:', safeStringify(payload))
      const reading = await this.readingRepository.create(payload)
      log(trace, '💾 lectura guardada id:', (reading as any)?._id || (reading as any)?.id)

      await SensorRecentReadingsRepository.addRecentReading(
        data.sensorId,
        {
          ...payload,
          timestamp: payload.timestamp,
        },
        5
      )
      log(trace, '🧰 Redis recent readings actualizado para sensor:', data.sensorId)

      // Generar alerta si es necesario
      if (isAlert && reading.mineroId && sensor.alertThreshold !== null) {
        log(trace, '🚨 creando alerta para usuario:', reading.mineroId)
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
    } catch (e) {
      error(trace, '❌ ingestReading error:', e)
      throw e
    } finally {
      await this.disconnect()
      console.timeEnd(`[${trace}] ingestReading`)
    }
  }

  async ingestBatchReadings(readings: CreateSensorReadingDto[]): Promise<SensorReadingDocument[]> {
    const trace = makeTraceId()
    console.time(`[${trace}] ingestBatchReadings`)
    await this.connect()
    try {
      log(trace, '▶️ ingestBatchReadings total:', readings.length)
      const results: SensorReadingDocument[] = []
      for (const [i, data] of readings.entries()) {
        try {
          log(trace, `→ item ${i}`, safeStringify(data))
          const reading = await this.ingestReading(data) // ya loguea internamente
          results.push(reading)
        } catch (e) {
          error(trace, `❌ error en item ${i}:`, e)
        }
      }
      log(trace, '✅ batch completado. Guardadas:', results.length)
      return results
    } finally {
      await this.disconnect()
      console.timeEnd(`[${trace}] ingestBatchReadings`)
    }
  }

  async getSensorReadings(sensorId: string, limit = 10): Promise<SensorReadingDocument[]> {
    const trace = makeTraceId()
    console.time(`[${trace}] getSensorReadings`)
    await this.connect()
    try {
      log(trace, `▶️ getSensorReadings sensorId:${sensorId} limit:${limit}`)
      const res = await this.readingRepository.findBySensorId(sensorId, limit)
      log(trace, '📤 getSensorReadings devuelve:', res.length)
      return res
    } finally {
      await this.disconnect()
      console.timeEnd(`[${trace}] getSensorReadings`)
    }
  }

  async getRecentReadingsRedis(sensorId: string): Promise<any[]> {
    const trace = makeTraceId()
    log(trace, `▶️ getRecentReadingsRedis sensorId:${sensorId}`)
    const res = await SensorRecentReadingsRepository.getRecentReadings(sensorId)
    log(trace, '📤 getRecentReadingsRedis devuelve:', res.length)
    return res
  }

  async getReadings(filters: SensorReadingFiltersDto): Promise<SensorReadingDocument[]> {
    const trace = makeTraceId()
    console.time(`[${trace}] getReadings`)
    await this.connect()
    try {
      log(trace, '▶️ getReadings filtros:', safeStringify(filters))
      const res = await this.readingRepository.findWithFilters(filters)
      log(trace, '📤 getReadings devuelve:', res.length)
      return res
    } finally {
      await this.disconnect()
      console.timeEnd(`[${trace}] getReadings`)
    }
  }

  async getRecentReadings(mineroId: string, minutes = 30): Promise<SensorReadingDocument[]> {
    const trace = makeTraceId()
    console.time(`[${trace}] getRecentReadings`)
    await this.connect()
    try {
      log(trace, `▶️ getRecentReadings mineroId:${mineroId} minutes:${minutes}`)
      const res = await this.readingRepository.getRecentReadings(mineroId, minutes)
      log(trace, '📤 getRecentReadings devuelve:', res.length)
      return res
    } finally {
      await this.disconnect()
      console.timeEnd(`[${trace}] getRecentReadings`)
    }
  }

  async getSensorStats(sensorId: string, hours = 24): Promise<SensorStatsDto> {
    const trace = makeTraceId()
    console.time(`[${trace}] getSensorStats`)
    await this.connect()
    try {
      log(trace, `▶️ getSensorStats sensorId:${sensorId} hours:${hours}`)
      const stats = await this.readingRepository.getSensorStats(sensorId, hours)
      const out: SensorStatsDto = {
        sensorId,
        avgValue: stats.avgValue,
        minValue: stats.minValue,
        maxValue: stats.maxValue,
        readingCount: stats.readingCount,
        alertCount: stats.alertCount,
        lastReading: new Date().toISOString(),
        trend: 'stable',
      }
      log(trace, '📊 getSensorStats resultado:', safeStringify(out))
      return out
    } finally {
      await this.disconnect()
      console.timeEnd(`[${trace}] getSensorStats`)
    }
  }

  async getReadingsByCreatedAt(
    field: 'sensorId' | 'cascoId' | 'mineroId',
    identifier: string,
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<any[]> {
    const trace = makeTraceId()
    console.time(`[${trace}] getReadingsByCreatedAt`)
    await this.connect()
    try {
      log(trace, `▶️ getReadingsByCreatedAt field:${field} identifier:${identifier} limit:${limit}`)
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000)
      const end = endDate ? new Date(endDate) : new Date()
      const docs = await this.readingRepository.findByCreatedAt(field, identifier, start, end, limit)
      const mapped = docs.map((d: any) => ({
        ...d,
        createdAtUtc: d.createdAt ? new Date(d.createdAt).toISOString() : null,
        createdAtLocal: d.createdAt ? new Date(d.createdAt).toLocaleString() : null,
        timestampUtc: d.timestamp ? new Date(d.timestamp).toISOString() : null,
        timestampLocal: d.timestamp ? new Date(d.timestamp).toLocaleString() : null,
      }))
      log(trace, '📤 getReadingsByCreatedAt devuelve:', mapped.length)
      return mapped
    } finally {
      await this.disconnect()
      console.timeEnd(`[${trace}] getReadingsByCreatedAt`)
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
    const trace = makeTraceId()
    console.time(`[${trace}] publishSensorData`)
    log(trace, '🛠 publishSensorData input:', safeStringify(input))

    const { cascoId, sensorId, data } = input

    // 🚨 Validar que mineroId exista y sea string
    if (!data.mineroId || typeof data.mineroId !== 'string' || !data.mineroId.trim()) {
      error(trace, '❌ mineroId inválido:', data.mineroId)
      throw new Error('mineroId es obligatorio y debe ser un string no vacío')
    }

    // Obtener sensor
    const sensor = await this.sensorRepository.findById(sensorId)
    if (!sensor) {
      error(trace, '❌ sensor no encontrado:', sensorId)
      throw new Error('Sensor no encontrado')
    }
    log(trace, '✅ sensor encontrado:', `${sensor.name} (${sensor.type})`)

    // Normalizar datos
    const locationObj =
      typeof data.location === 'string'
        ? (() => {
            try {
              return JSON.parse(data.location)
            } catch {
              warn(trace, '⚠️ location string no parseable:', data.location)
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

    log(trace, '📦 payload final para ingest:', safeStringify(readingPayload))

    try {
      const saved = await this.ingestReading(readingPayload) // ya loguea internamente
      log(trace, '✅ publishSensorData OK, id:', (saved as any)?._id || (saved as any)?.id)
    } finally {
      console.timeEnd(`[${trace}] publishSensorData`)
    }
  }
}
