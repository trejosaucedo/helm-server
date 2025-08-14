import type { HttpContext } from '@adonisjs/core/http'
import { CascoService } from '#services/casco_service'
import { SensorService } from '#services/sensor_service'
import {
  activateCascoValidator,
  assignCascoValidator,
  createCascoValidator,
  updateCascoValidator,
} from '#validators/casco'
import { ErrorHandler } from '#utils/error_handler'
import db from '@adonisjs/lucid/services/db'

// Helpers
function requireUser(ctx: HttpContext) {
  if (!ctx.user) {
    // Respondemos aquí y retornamos undefined, no lanzamos error
    ctx.response.status(401).json({
      success: false,
      message: 'No autenticado',
      data: null,
    })
    return undefined
  }
  return ctx.user
}

function jsonSuccess(
  response: HttpContext['response'],
  message: string,
  data: any = null,
  status = 200
) {
  return response.status(status).json({ success: true, message, data })
}

function jsonError(
  response: HttpContext['response'],
  message: string,
  status = 400,
  data: any = null
) {
  return response.status(status).json({ success: false, message, data })
}

export default class CascoController {
  private cascoService: CascoService
  private sensorService: SensorService

  constructor() {
    this.cascoService = new CascoService()
    this.sensorService = new SensorService()
  }

  // Renombrar el método para que coincida con la ruta
  async myHelmets(ctx: HttpContext) {
    try {
      const user = ctx.user
      if (!user) {
        return ctx.response
          .status(401)
          .json({ success: false, message: 'No autenticado', data: null })
      }
      // Si es admin, puede ver todos los cascos; si es supervisor, solo los suyos
      let cascos
      if (user.role === 'admin') {
        cascos = await this.cascoService.getAllCascos()
      } else {
        cascos = await this.cascoService.getCascosBySupervisor(user.id)
      }
      return ctx.response.json({
        success: true,
        message: 'Cascos obtenidos exitosamente',
        data: cascos,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_MY_HELMETS')
      return ctx.response
        .status(500)
        .json({ success: false, message: 'Error al obtener cascos', data: null })
    }
  }

  async activate(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const payload = await ctx.request.validateUsing(activateCascoValidator)
      
      // Verificar si el casco ya está asignado al usuario para determinar el mensaje
      const existingCasco = await this.cascoService.findByPhysicalId(payload.physicalId)
      const isReactivation = existingCasco && existingCasco.supervisorId === user.id
      
      const result = await this.cascoService.activateCascoByPhysicalId(user.id, payload.physicalId)
      const message = isReactivation ? 'Casco reactivado exitosamente' : 'Casco activado exitosamente'
      
      return jsonSuccess(ctx.response, message, result, 201)
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_ACTIVATE')
      return jsonError(ctx.response, error.message || 'Error al activar casco', 400)
    }
  }

  async desactivate(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const cascoId = ctx.request.input('cascoId')
      const desactivationData = { cascoId, supervisorId: user.id }
      await this.cascoService.deactivateCasco(desactivationData)
      return jsonSuccess(ctx.response, 'Casco desactivado exitosamente')
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_DEACTIVATE')
      return jsonError(ctx.response, error.message || 'Error al desactivar casco', 400)
    }
  }

  async index(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const cascos = await this.cascoService.getCascosBySupervisor(user.id)
      return jsonSuccess(ctx.response, 'Cascos obtenidos exitosamente', cascos)
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_INDEX')
      return jsonError(ctx.response, error.message || 'Error al obtener cascos', 500)
    }
  }

  async available(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const cascos = await this.cascoService.getAvailableCascos(user.id)
      return jsonSuccess(ctx.response, 'Cascos disponibles obtenidos exitosamente', cascos)
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_AVAILABLE')
      return jsonError(ctx.response, error.message || 'Error al obtener cascos disponibles', 500)
    }
  }

  async assign(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const payload = await ctx.request.validateUsing(assignCascoValidator)
      const assignData = { ...payload, supervisorId: user.id }
      await this.cascoService.assignCasco(assignData)
      return jsonSuccess(ctx.response, 'Casco asignado exitosamente')
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_ASSIGN')
      return jsonError(ctx.response, error.message || 'Error al asignar casco', 400)
    }
  }

  async unassign(ctx: HttpContext) {
    try {
      const user = requireUser(ctx)
      if (!user) return

      const cascoId = ctx.request.input('cascoId')
      const unassignData = { cascoId, supervisorId: user.id }
      await this.cascoService.unassignCasco(unassignData)
      return jsonSuccess(ctx.response, 'Casco desasignado exitosamente')
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_UNASSIGN')
      return jsonError(ctx.response, error.message || 'Error al desasignar casco', 400)
    }
  }

  // Función helper para crear los sensores por defecto
  private getDefaultSensors(cascoId: string) {
    return [
      {
        cascoId,
        type: 'gps' as const,
        name: 'GPS Tracker',
        unit: 'coords',
        sampleRate: 5000, // 5 segundos
      },
      {
        cascoId,
        type: 'heart_rate' as const,
        name: 'Monitor de Ritmo Cardíaco',
        minValue: 60,
        maxValue: 120,
        unit: 'bpm',
        sampleRate: 10000, // 10 segundos
        alertThreshold: 130,
      },
      {
        cascoId,
        type: 'body_temperature' as const,
        name: 'Sensor de Temperatura Corporal',
        minValue: 35,
        maxValue: 38,
        unit: '°C',
        sampleRate: 15000, // 15 segundos
        alertThreshold: 38.5,
      },
      {
        cascoId,
        type: 'gas' as const,
        name: 'Detector de Gas',
        minValue: 0,
        maxValue: 100,
        unit: 'ppm',
        sampleRate: 3000, // 3 segundos
        alertThreshold: 50,
      },
    ]
  }

  async create({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createCascoValidator)

      // Si no se proporciona supervisorId, usar el usuario autenticado
      const supervisorId = payload.supervisorId || null

      const newCasco = await this.cascoService.createCascoAdmin({
        serial: payload.physicalId, // Usar physicalId como serial por defecto
        physicalId: payload.physicalId,
        supervisorId: supervisorId,
      })

      // Crear los 4 sensores por defecto
      const defaultSensors = this.getDefaultSensors(newCasco.id)
      const createdSensors = []

      for (const sensorData of defaultSensors) {
        try {
          const sensor = await this.sensorService.createSensor(sensorData)
          createdSensors.push(sensor)
        } catch (sensorError) {
          console.warn(`Error al crear sensor ${sensorData.type}:`, sensorError)
        }
      }

      return response.created({
        success: true,
        message: 'Casco creado exitosamente con sensores',
        data: {
          casco: newCasco,
          sensors: createdSensors,
        },
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_CREATE')
      return ErrorHandler.handleError(error, response, 'Error al crear casco', 400)
    }
  }

  async getCasco({ params, response }: HttpContext) {
    try {
      const id = params.id
      const casco = await this.cascoService.cascoRepository.findById(id)
      if (!casco) {
        return response
          .status(404)
          .json({ success: false, message: 'Casco no encontrado', data: null })
      }
      return response.json({
        success: true,
        message: 'Detalle de casco obtenido exitosamente',
        data: casco,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'GET_CASCO_DETAIL')
      return response
        .status(400)
        .json({ success: false, message: 'Error al obtener detalle de casco', data: null })
    }
  }

  async updateCasco({ params, request, response }: HttpContext) {
    try {
      const id = params.id
      const payload = await request.validateUsing(updateCascoValidator)
      const casco = await this.cascoService.cascoRepository.findById(id)
      if (!casco) {
        return response
          .status(404)
          .json({ success: false, message: 'Casco no encontrado', data: null })
      }
      Object.assign(casco, payload)
      await casco.save()
      return response.json({
        success: true,
        message: 'Casco actualizado exitosamente',
        data: casco,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'UPDATE_CASCO')
      return response
        .status(400)
        .json({ success: false, message: 'Error al actualizar casco', data: null })
    }
  }

  async deleteCasco({ params, response }: HttpContext) {
    try {
      const id = params.id
      const casco = await this.cascoService.cascoRepository.findById(id)
      if (!casco) {
        return response
          .status(404)
          .json({ success: false, message: 'Casco no encontrado', data: null })
      }
      await casco.delete()
      return response.json({ success: true, message: 'Casco eliminado exitosamente' })
    } catch (error) {
      ErrorHandler.logError(error, 'DELETE_CASCO')
      return response
        .status(400)
        .json({ success: false, message: 'Error al eliminar casco', data: null })
    }
  }

  // MÉTODO TEMPORAL - ELIMINAR DESPUÉS DE DEBUGGING
  async cleanCascos({ response }: HttpContext) {
    try {
      // Eliminar todos los cascos para limpiar registros corruptos
      await db.from('cascos').delete()

      return response.ok({
        success: true,
        message: 'Tabla cascos limpiada exitosamente',
        data: null,
      })
    } catch (error) {
      ErrorHandler.logError(error, 'CASCO_CLEAN')
      return ErrorHandler.handleError(error, response, 'Error al limpiar cascos', 400)
    }
  }
}
