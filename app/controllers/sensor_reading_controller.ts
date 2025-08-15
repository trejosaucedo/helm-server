import type { HttpContext } from '@adonisjs/core/http'
import { SensorReadingService } from '#services/sensor_reading_service'
import { SensorService } from '#services/sensor_service'
import { sensorReadingCreatedAtFiltersValidator } from '#validators/sensor'
import {
  createSensorReadingValidator,
  batchSensorDataValidator,
  sensorReadingFiltersValidator,
} from '#validators/sensor'
import { ErrorHandler } from '#utils/error_handler'
import mongoose from 'mongoose'
import env from '#start/env'

export default class SensorReadingController {
  private readingService: SensorReadingService
  private sensorReadingService: SensorReadingService

  constructor() {
    this.readingService = new SensorReadingService()
    this.sensorReadingService = new SensorReadingService()
  }

  // POST /sensors/readings
  async ingestReading({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createSensorReadingValidator)
      const reading = await this.readingService.ingestReading(payload)
      return response.status(201).json({
        success: true,
        message: 'Lectura procesada exitosamente',
        data: reading,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_INGEST_READING')
      return ErrorHandler.handleError(error, response, 'Error al procesar lectura', 400)
    }
  }

  // POST /sensors/readings/batch
  async ingestBatchReadings({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(batchSensorDataValidator)
      const readings = await this.readingService.ingestBatchReadings(payload.readings)
      return response.status(201).json({
        success: true,
        message: `${readings.length} lecturas procesadas exitosamente`,
        data: readings,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_INGEST_BATCH')
      return ErrorHandler.handleError(error, response, 'Error al procesar lecturas', 400)
    }
  }

  // GET /sensors/readings
  async getReadings({ request, response }: HttpContext) {
    try {
      const filters = await request.validateUsing(sensorReadingFiltersValidator)
      const readings = await this.readingService.getReadings(filters)
      return response.json({
        success: true,
        message: 'Lecturas obtenidas exitosamente',
        data: readings,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_GET_READINGS')
      return ErrorHandler.handleError(error, response, 'Error al obtener lecturas', 400)
    }
  }

  // GET /sensors/readings/recent/:mineroId
  async getRecentReadings({ params, request, response }: HttpContext) {
    try {
      const minutes = Number.parseInt(request.qs().minutes || '30', 10)
      const readings = await this.readingService.getRecentReadings(params.mineroId, minutes)
      return response.json({
        success: true,
        message: 'Lecturas recientes obtenidas exitosamente',
        data: readings,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_GET_RECENT_READINGS')
      return ErrorHandler.handleError(error, response, 'Error al obtener lecturas recientes', 400)
    }
  }

  // GET /sensors/:sensorId/stats
  async getSensorStats({ params, request, response }: HttpContext) {
    try {
      const hours = Number.parseInt(request.qs().hours || '24', 10)
      const stats = await this.readingService.getSensorStats(params.sensorId, hours)
      return response.json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_GET_STATS')
      return ErrorHandler.handleError(error, response, 'Error al obtener estadísticas', 400)
    }
  }

  // GET /sensors/readings/by-created
  async getReadingsByCreatedAt({ request, response }: HttpContext) {
    try {
      const { field, identifier, startDate, endDate, limit } = await request.validateUsing(
        sensorReadingCreatedAtFiltersValidator
      )
      const readings = await this.readingService.getReadingsByCreatedAt(
        field as 'sensorId' | 'cascoId' | 'mineroId',
        identifier,
        startDate,
        endDate,
        limit
      )
      return response.json({
        success: true,
        message: 'Lecturas obtenidas exitosamente',
        data: readings,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_GET_BY_CREATED_AT')
      return ErrorHandler.handleError(
        error,
        response,
        'Error al obtener lecturas por createdAt',
        400
      )
    }
  }

  async recentReadingsFromRedis({ params, response }: HttpContext) {
    try {
      const readings = await this.sensorReadingService.getRecentReadingsRedis(params.sensorId)
      return response.json({
        success: true,
        message: 'Lecturas recientes desde Redis',
        data: readings,
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Error al obtener lecturas recientes desde Redis',
      })
    }
  }

  // POST /cascos/:cascoId/sensores/:sensorId
  // Recibe datos del dispositivo Raspberry Pi (IoT)
  async publishSensorData({ params, request, response }: HttpContext) {
    try {
      const { cascoId, sensorId } = params
      const deviceToken = request.header('x-device-token')
      const sensorData = request.body()

      if (!deviceToken) {
        return response.status(401).json({
          success: false,
          message: 'Token de dispositivo requerido',
        })
      }

      // Validar que el casco existe
      const sensorService = new SensorService()
      const cascoExists = await sensorService.validateCascoExists(cascoId)
      if (!cascoExists) {
        return response.status(404).json({
          success: false,
          message: `Casco ${cascoId} no encontrado`,
        })
      }

      // Validar que el sensor existe en ese casco específico
      const sensorValidation = await sensorService.validateSensorInCasco(sensorId, cascoId)
      if (!sensorValidation.isValid) {
        return response.status(404).json({
          success: false,
          message: sensorValidation.message,
        })
      }

      // Procesar datos del sensor con el servicio de readings
      await this.readingService.publishSensorData({
        cascoId,
        sensorId,
        data: sensorData,
        deviceToken,
      })

      return response.json({
        success: true,
        message: 'Datos de sensor procesados exitosamente',
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_PUBLISH_DATA')
      return ErrorHandler.handleError(error, response, 'Error al procesar datos del sensor', 400)
    }
  }

  // POST /cascos/:cascoId/sensores/batch
  // Recibe múltiples lecturas del dispositivo Raspberry Pi (IoT) en una sola petición
  async publishBatchSensorData({ params, request, response }: HttpContext) {
    try {
      const { cascoId } = params
      const deviceToken = request.header('x-device-token')
      const batchData = request.body()

      if (!deviceToken) {
        return response.status(401).json({
          success: false,
          message: 'Token de dispositivo requerido',
        })
      }

      if (!Array.isArray(batchData) || batchData.length === 0) {
        return response.status(400).json({
          success: false,
          message: 'Se requiere un arreglo de lecturas no vacío',
        })
      }

      // Validar que el casco existe
      const sensorService = new SensorService()
      const cascoExists = await sensorService.validateCascoExists(cascoId)
      if (!cascoExists) {
        return response.status(404).json({
          success: false,
          message: `Casco ${cascoId} no encontrado`,
        })
      }

      const results = []
      const errors = []

      // Procesar cada lectura en el batch
      for (const [i, sensorData] of batchData.entries()) {
        try {
          // Validar que el sensor existe en ese casco específico
          const sensorValidation = await sensorService.validateSensorInCasco(
            sensorData.sensorId,
            cascoId
          )
          if (!sensorValidation.isValid) {
            errors.push({
              index: i,
              sensorId: sensorData.sensorId,
              error: sensorValidation.message,
            })
            continue
          }

          // Procesar datos del sensor
          await this.readingService.publishSensorData({
            cascoId,
            sensorId: sensorData.sensorId,
            data: sensorData,
            deviceToken,
          })

          results.push({
            index: i,
            sensorId: sensorData.sensorId,
            status: 'success',
          })
        } catch (error) {
          errors.push({
            index: i,
            sensorId: sensorData.sensorId,
            error: error.message,
          })
        }
      }

      return response.status(201).json({
        success: true,
        message: `Batch procesado: ${results.length} exitosas, ${errors.length} errores`,
        data: {
          processed: results.length,
          errors: errors.length,
          results: results,
          errorDetails: errors,
        },
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_PUBLISH_BATCH_DATA')
      return ErrorHandler.handleError(error, response, 'Error al procesar batch de sensores', 400)
    }
  }
  public async timeseriesThree({ request, response }: HttpContext) {
    try {
      // Colección por defecto: sensor_readings
      const COLLECTION = env.get('MONGO_COLLECTION', 'sensor_readings')
      const col = mongoose.connection.db.collection(COLLECTION)

      const qs = request.qs()
      const bucket = (qs.bucket || 'hour') as 'minute' | 'hour' | 'day'
      const agg = (qs.agg || 'avg') as 'avg' | 'min' | 'max' | 'sum' | 'count'
      const tz = (qs.tz || 'America/Monterrey') as string

      // Filtros requeridos/opcionales
      const cascoId = String(qs.cascoId || '')
      if (!cascoId) {
        return response.badRequest({ success: false, message: 'cascoId requerido' })
      }

      const baseMatch: any = { cascoId }
      if (qs.sensorId) baseMatch.sensorId = qs.sensorId
      if (qs.mineroId) baseMatch.mineroId = qs.mineroId

      // Rango: usa start/end si vienen; si no, últimas 24h con $$NOW
      const timeMatch =
        qs.start && qs.end
          ? { timestamp: { $gte: new Date(qs.start), $lte: new Date(qs.end) } }
          : {
            $expr: {
              $and: [
                { $gte: ['$timestamp', { $dateSubtract: { startDate: '$$NOW', unit: 'hour', amount: 24 } }] },
                { $lte: ['$timestamp', '$$NOW'] },
              ],
            },
          }

      const match: any = { ...baseMatch, ...timeMatch }

      // Normalización numérica
      const addNumeric = {
        $addFields: {
          t: { $dateTrunc: { date: '$timestamp', unit: bucket, timezone: tz } },
          m_mq7:  { $convert: { input: '$metadata.mq7',  to: 'double', onError: null, onNull: null } },
          m_temp: { $convert: { input: '$metadata.tempC', to: 'double', onError: null, onNull: null } },
          m_bpm:  { $convert: { input: '$metadata.bpm',  to: 'double', onError: null, onNull: null } },
        },
      }

      // Helper para operación de agregación
      const mkAgg = (field: string) =>
        agg === 'avg' ? { $avg: field } :
          agg === 'min' ? { $min: field } :
            agg === 'max' ? { $max: field } :
              agg === 'sum' ? { $sum: field } :
                { $sum: { $cond: [{ $ne: [field, null] }, 1, 0] } } // count no nulos

      const pipeline: any[] = [
        { $match: match },
        addNumeric,
        {
          $group: {
            _id: '$t',
            mq7:  mkAgg('$m_mq7'),
            temp: mkAgg('$m_temp'),
            bpm:  mkAgg('$m_bpm'),
          },
        },
        { $project: { _id: 0, t: '$_id', mq7: 1, temp: 1, bpm: 1 } },
        { $sort: { t: 1 } },
      ]

      const rows = await col.aggregate(pipeline, { allowDiskUse: true }).toArray()

      // 3 series separadas
      const mq7Points  = rows.filter(r => r.mq7  !== null && r.mq7  !== undefined).map(r => ({ t: r.t, y: r.mq7  }))
      const tempPoints = rows.filter(r => r.temp !== null && r.temp !== undefined).map(r => ({ t: r.t, y: r.temp }))
      const bpmPoints  = rows.filter(r => r.bpm  !== null && r.bpm  !== undefined).map(r => ({ t: r.t, y: r.bpm  }))

      return response.ok({
        success: true,
        message: 'Series temporales (mq7, temp, bpm)',
        data: {
          meta: {
            agg, bucket, tz,
            // si no mandaste start/end, el rango efectivo fue últimas 24h
            start: qs.start ? new Date(qs.start) : null,
            end:   qs.end   ? new Date(qs.end)   : null,
            filters: { cascoId, sensorId: qs.sensorId ?? null, mineroId: qs.mineroId ?? null },
          },
          mq7:  { unit: 'ppm', points: mq7Points },
          temp: { unit: '°C',  points: tempPoints },
          bpm:  { unit: 'bpm', points: bpmPoints },
        },
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_TRI_SERIES')
      return ErrorHandler.handleError(error, response, 'Error al generar tri-series', 400)
    }
  }

}
