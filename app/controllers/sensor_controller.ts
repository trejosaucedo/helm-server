import type { HttpContext } from '@adonisjs/core/http'
import { SensorService } from '#services/sensor_service'
import { createSensorValidator, updateSensorValidator } from '#validators/sensor'
import { ErrorHandler } from '#utils/error_handler'

export default class SensorController {
  private sensorService: SensorService

  constructor() {
    this.sensorService = new SensorService()
  }

  // POST /sensors
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

  // PUT /sensors/:id
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

  // GET /sensors/casco/:cascoId
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

  // GET /sensors/minero/:mineroId
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
}
