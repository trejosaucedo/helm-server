import type { HttpContext } from '@adonisjs/core/http'
import { SensorReadingService } from '#services/sensor_reading_service'
import { SensorService } from '#services/sensor_service'
import {
  createSensorReadingValidator,
  batchSensorDataValidator,
  sensorReadingFiltersValidator,
} from '#validators/sensor'
import { ErrorHandler } from '#utils/error_handler'

export default class SensorReadingController {
  private readingService: SensorReadingService

  constructor() {
    this.readingService = new SensorReadingService()
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
}
