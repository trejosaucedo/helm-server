/**
 * Servicio para manejar lecturas de sensores en MongoDB
 * MongoDB es ideal para datos de alta frecuencia como lecturas de sensores IoT
 */

import { MongoClient, Collection, Db } from 'mongodb'
import env from '#start/env'
export type SensorReadingPayload = Omit<SensorReadingDocument, '_id' | 'receivedAt' | 'createdAt'>

export interface SensorReadingDocument {
  _id?: string
  sensorId: string
  cascoId: string
  mineroId?: string
  value: number
  unit: string
  isNormal: boolean
  isAlert: boolean
  batteryLevel?: number
  signalStrength?: number
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
  metadata?: Record<string, any>
  timestamp: Date // Momento de la lectura del sensor
  receivedAt: Date // Momento de recepción en el servidor
  createdAt: Date
}

export class SensorReadingMongoService {
  private client: MongoClient
  private db: Db
  private collection: Collection<SensorReadingDocument>

  constructor() {
    const mongoUrl = env.get('MONGODB_URL')
    if (!mongoUrl) {
      throw new Error('MONGODB_URL no está configurada en el archivo .env')
    }

    this.client = new MongoClient(mongoUrl)
    this.db = this.client.db('helm-nosql')
    this.collection = this.db.collection<SensorReadingDocument>('sensor_readings')
  }

  async connect(): Promise<void> {
    await this.client.connect()
    console.log('🍃 MongoDB conectado para lecturas de sensores')
  }

  async disconnect(): Promise<void> {
    await this.client.close()
    console.log('🍃 MongoDB desconectado')
  }

  /**
   * Insertar una nueva lectura de sensor
   */
  async insertReading(
    reading: Omit<SensorReadingDocument, '_id' | 'createdAt'>
  ): Promise<SensorReadingDocument> {
    const document: SensorReadingDocument = {
      ...reading,
      createdAt: new Date(),
    }

    const result = await this.collection.insertOne(document)
    return { ...document, _id: result.insertedId.toString() }
  }

  /**
   * Insertar múltiples lecturas (para batch processing)
   */
  async insertManyReadings(
    readings: Omit<SensorReadingDocument, '_id' | 'createdAt'>[]
  ): Promise<void> {
    const documents = readings.map((reading) => ({
      ...reading,
      createdAt: new Date(),
    }))

    await this.collection.insertMany(documents)
  }

  /**
   * Obtener lecturas por rango de fechas
   */
  async getReadingsByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      sensorId?: string
      cascoId?: string
      mineroId?: string
      limit?: number
      alertsOnly?: boolean
    }
  ): Promise<SensorReadingDocument[]> {
    const filter: any = {
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    }

    if (options?.sensorId) filter.sensorId = options.sensorId
    if (options?.cascoId) filter.cascoId = options.cascoId
    if (options?.mineroId) filter.mineroId = options.mineroId
    if (options?.alertsOnly) filter.isAlert = true

    const cursor = this.collection
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 1000)

    return await cursor.toArray()
  }

  /**
   * Obtener las últimas lecturas de un sensor
   */
  async getLatestReadings(sensorId: string, limit: number = 10): Promise<SensorReadingDocument[]> {
    return await this.collection.find({ sensorId }).sort({ timestamp: -1 }).limit(limit).toArray()
  }

  /**
   * Obtener lecturas de alerta
   */
  async getAlertReadings(options?: {
    cascoId?: string
    mineroId?: string
    limit?: number
    since?: Date
  }): Promise<SensorReadingDocument[]> {
    const filter: any = { isAlert: true }

    if (options?.cascoId) filter.cascoId = options.cascoId
    if (options?.mineroId) filter.mineroId = options.mineroId
    if (options?.since) filter.timestamp = { $gte: options.since }

    return await this.collection
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(options?.limit || 100)
      .toArray()
  }

  /**
   * Obtener estadísticas de un sensor
   */
  async getSensorStats(
    sensorId: string,
    hours: number = 24
  ): Promise<{
    count: number
    avg: number
    min: number
    max: number
    alertCount: number
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const stats = await this.collection
      .aggregate([
        {
          $match: {
            sensorId,
            timestamp: { $gte: since },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avg: { $avg: '$value' },
            min: { $min: '$value' },
            max: { $max: '$value' },
            alertCount: {
              $sum: { $cond: ['$isAlert', 1, 0] },
            },
          },
        },
      ])
      .toArray()

    return (stats[0] as any) || { count: 0, avg: 0, min: 0, max: 0, alertCount: 0 }
  }

  /**
   * Obtener tendencias por horas
   */
  async getHourlyTrends(
    sensorId: string,
    hours: number = 24
  ): Promise<
    Array<{
      hour: string
      avgValue: number
      minValue: number
      maxValue: number
      readingCount: number
      alertCount: number
    }>
  > {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const trends = await this.collection
      .aggregate([
        {
          $match: {
            sensorId,
            timestamp: { $gte: since },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d %H:00',
                date: '$timestamp',
              },
            },
            avgValue: { $avg: '$value' },
            minValue: { $min: '$value' },
            maxValue: { $max: '$value' },
            readingCount: { $sum: 1 },
            alertCount: {
              $sum: { $cond: ['$isAlert', 1, 0] },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ])
      .toArray()

    return trends.map((trend) => ({
      hour: trend._id,
      avgValue: trend.avgValue,
      minValue: trend.minValue,
      maxValue: trend.maxValue,
      readingCount: trend.readingCount,
      alertCount: trend.alertCount,
    }))
  }

  /**
   * Limpiar lecturas antiguas (mantener solo los últimos N días)
   */
  async cleanOldReadings(daysToKeep: number = 30): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)

    const result = await this.collection.deleteMany({
      timestamp: { $lt: cutoffDate },
    })

    return { deletedCount: result.deletedCount }
  }
}
