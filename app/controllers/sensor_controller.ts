import type { HttpContext } from '@adonisjs/core/http'
import { SensorService } from '#services/sensor_service'
import {
  createSensorValidator,
  updateSensorValidator,
  createSensorReadingValidator,
  sensorReadingFiltersValidator,
  batchSensorDataValidator,
} from '#validators/sensor'
import { ErrorHandler } from '#utils/error_handler'

export default class SensorController {
  private sensorService: SensorService

  constructor() {
    this.sensorService = new SensorService()
  }

  /**
   * POST /sensors
   * Crea un nuevo sensor
   */
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createSensorValidator)
      const sensor = await this.sensorService.createSensor(payload)

      return response.status(201).json({
        success: true,
        message: 'Sensor creado exitosamente',
        data: sensor,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_CREATE')
      return ErrorHandler.handleError(error, response, 'Error al crear sensor', 400)
    }
  }

  /**
   * PUT /sensors/:id
   * Actualiza un sensor existente
   */
  async update({ request, response, params }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateSensorValidator)
      const sensor = await this.sensorService.updateSensor(params.id, payload)
      
      if (!sensor) {
        return response.status(404).json({
          success: false,
          message: 'Sensor no encontrado',
        })
      }

      return response.json({
        success: true,
        message: 'Sensor actualizado exitosamente',
        data: sensor,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_UPDATE')
      return ErrorHandler.handleError(error, response, 'Error al actualizar sensor', 400)
    }
  }

  /**
   * GET /sensors/casco/:cascoId
   * Obtiene sensores de un casco específico
   */
  async getByCasco({ params, response }: HttpContext) {
    try {
      const sensors = await this.sensorService.getSensorsByCasco(params.cascoId)

      return response.json({
        success: true,
        message: 'Sensores obtenidos exitosamente',
        data: sensors,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_GET_BY_CASCO')
      return ErrorHandler.handleError(error, response, 'Error al obtener sensores', 400)
    }
  }

  /**
   * GET /sensors/minero/:mineroId
   * Obtiene sensores de un minero específico
   */
  async getByMinero({ params, response }: HttpContext) {
    try {
      const sensors = await this.sensorService.getSensorsByMinero(params.mineroId)

      return response.json({
        success: true,
        message: 'Sensores obtenidos exitosamente',
        data: sensors,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'SENSOR_GET_BY_MINERO')
      return ErrorHandler.handleError(error, response, 'Error al obtener sensores', 400)
    }
  }

  /**
   * POST /sensors/readings
   * Ingesta una nueva lectura de sensor
   */
  async ingestReading({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createSensorReadingValidator)
      const reading = await this.sensorService.ingestReading(payload)

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

  /**
   * POST /sensors/readings/batch
   * Ingesta múltiples lecturas en batch
   */
  async ingestBatchReadings({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(batchSensorDataValidator)
      const readings = await this.sensorService.ingestBatchReadings(payload.readings)

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

  /**
   * GET /sensors/readings
   * Obtiene lecturas con filtros
   */
  async getReadings({ request, response }: HttpContext) {
    try {
      const filters = await request.validateUsing(sensorReadingFiltersValidator)
      const readings = await this.sensorService.getReadings(filters)

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

  /**
   * GET /sensors/readings/recent/:mineroId
   * Obtiene lecturas recientes de un minero
   */
  async getRecentReadings({ params, request, response }: HttpContext) {
    try {
      const minutes = parseInt(request.qs().minutes || '30', 10)
      const readings = await this.sensorService.getRecentReadings(params.mineroId, minutes)

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

  /**
   * GET /sensors/:id/stats
   * Obtiene estadísticas de un sensor
   */
  async getSensorStats({ params, request, response }: HttpContext) {
    try {
      const hours = parseInt(request.qs().hours || '24', 10)
      const stats = await this.sensorService.getSensorStats(params.id, hours)

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

  /**
   * POST /cascos/:cascoId/sensores/:sensorId
   * Recibe datos del dispositivo Raspberry Pi
   */
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

      // 1. Validar que el casco existe
      const cascoExists = await this.sensorService.validateCascoExists(cascoId)
      if (!cascoExists) {
        return response.status(404).json({
          success: false,
          message: `Casco ${cascoId} no encontrado`,
        })
      }

      // 2. Validar que el sensor existe en ese casco específico
      const sensorValidation = await this.sensorService.validateSensorInCasco(sensorId, cascoId)
      if (!sensorValidation.isValid) {
        return response.status(404).json({
          success: false,
          message: sensorValidation.message,
        })
      }

      // 3. Procesar datos del sensor
      await this.sensorService.publishSensorData({
        cascoId,
        sensorId,
        data: sensorData,
        deviceToken
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
