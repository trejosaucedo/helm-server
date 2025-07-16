import { SensorRepository } from '#repositories/sensor_repository'
import { SensorReadingRepository } from '#repositories/sensor_reading_repository'
import { CascoRepository } from '#repositories/casco_repository'
import { NotificationService } from '#services/notification_service'
import type { SensorReadingDocument } from '#services/sensor_reading_mongo_service'
import type {
  CreateSensorDto,
  UpdateSensorDto,
  SensorResponseDto,
  CreateSensorReadingDto,
  SensorStatsDto,
} from '#dtos/sensor.dto'
import Sensor from '#models/sensor'

export class SensorService {
  private sensorRepository: SensorRepository
  private readingRepository: SensorReadingRepository
  private cascoRepository: CascoRepository
  private notificationService: NotificationService

  constructor() {
    this.sensorRepository = new SensorRepository()
    this.readingRepository = new SensorReadingRepository()
    this.cascoRepository = new CascoRepository()
    this.notificationService = new NotificationService()
  }

  // Conectar a MongoDB cuando se necesite
  async connect(): Promise<void> {
    await this.readingRepository.connect()
  }

  async disconnect(): Promise<void> {
    await this.readingRepository.disconnect()
  }

  /**
   * Crear un nuevo sensor
   */
  async createSensor(data: CreateSensorDto): Promise<SensorResponseDto> {
    const sensor = await this.sensorRepository.create(data)
    return this.mapSensorToResponse(sensor)
  }

  /**
   * Obtener sensores por casco
   */
  async getSensorsByCasco(cascoId: string): Promise<SensorResponseDto[]> {
    const sensors = await this.sensorRepository.findByCascoId(cascoId)
    return sensors.map(sensor => this.mapSensorToResponse(sensor))
  }

  /**
   * Obtener sensores por minero
   */
  async getSensorsByMinero(mineroId: string): Promise<SensorResponseDto[]> {
    const sensors = await this.sensorRepository.findByMineroId(mineroId)
    return sensors.map(sensor => this.mapSensorToResponse(sensor))
  }

  /**
   * Procesar lectura de sensor y crear alerta automática si es necesario
   */
  async createSensorReading(data: CreateSensorReadingDto): Promise<SensorReadingDocument> {
    // Conectar a MongoDB
    await this.connect()
    
    try {
      // Obtener información del sensor para validar rangos
      const sensor = await this.sensorRepository.findById(data.sensorId)
      if (!sensor) {
        throw new Error('Sensor no encontrado')
      }

      // Evaluar si la lectura es normal o alerta
      const isNormal = this.isReadingNormal(data.value, sensor)
      const isAlert = !isNormal && this.isReadingAlert(data.value, sensor)

      // Crear la lectura con evaluación automática
      const readingData = {
        ...data,
        isNormal,
        isAlert,
        timestamp: data.timestamp ? 
          (typeof data.timestamp === 'string' ? new Date(data.timestamp) : data.timestamp) 
          : new Date(),
      }

      const reading = await this.readingRepository.create(readingData)

      // Si es alerta, generar notificación automática
      if (isAlert) {
        await this.generateAlertNotification(reading, sensor)
      }

      return reading
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Ingerir lectura de sensor (alias para createSensorReading)
   */
  async ingestReading(data: CreateSensorReadingDto): Promise<SensorReadingDocument> {
    return await this.createSensorReading(data)
  }

  /**
   * Ingerir múltiples lecturas en batch
   */
  async ingestBatchReadings(readings: CreateSensorReadingDto[]): Promise<SensorReadingDocument[]> {
    await this.connect()
    try {
      const results: SensorReadingDocument[] = []
      
      for (const readingData of readings) {
        try {
          const reading = await this.createSensorReading(readingData)
          results.push(reading)
        } catch (error) {
          console.error('Error procesando lectura individual:', error)
          // Continuar con las demás lecturas
        }
      }
      
      return results
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Obtener lecturas de un sensor
   */
  async getSensorReadings(sensorId: string, limit: number = 10): Promise<SensorReadingDocument[]> {
    await this.connect()
    try {
      return await this.readingRepository.findBySensorId(sensorId, limit)
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Obtener estadísticas de un sensor
   */
  async getSensorStats(sensorId: string, hours: number = 24): Promise<SensorStatsDto> {
    await this.connect()
    try {
      const stats = await this.readingRepository.getSensorStats(sensorId, hours)
      return {
        sensorId,
        avgValue: stats.avgValue,
        minValue: stats.minValue,
        maxValue: stats.maxValue,
        readingCount: stats.readingCount,
        alertCount: stats.alertCount,
        lastReading: new Date().toISOString(), // Placeholder por ahora
        trend: 'stable' // Placeholder por ahora
      }
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Actualizar un sensor existente
   */
  async updateSensor(id: string, data: UpdateSensorDto): Promise<SensorResponseDto | null> {
    const sensor = await this.sensorRepository.update(id, data)
    if (!sensor) return null
    return this.mapSensorToResponse(sensor)
  }

  /**
   * Evaluar si una lectura está en rango normal
   */
  private isReadingNormal(value: number, sensor: Sensor): boolean {
    if (sensor.type === 'gps') {
      return true // GPS no tiene rangos normales
    }

    if (sensor.minValue !== null && value < sensor.minValue) {
      return false
    }

    if (sensor.maxValue !== null && value > sensor.maxValue) {
      return false
    }

    return true
  }

  /**
   * Evaluar si una lectura debe generar alerta
   */
  private isReadingAlert(value: number, sensor: Sensor): boolean {
    if (sensor.alertThreshold === null) {
      return false
    }

    // Para la mayoría de sensores, alerta si supera el umbral
    if (sensor.type === 'heart_rate' || sensor.type === 'body_temperature' || sensor.type === 'gas') {
      return value > sensor.alertThreshold
    }

    return false
  }

  /**
   * Generar notificación automática para alerta
   */
  private async generateAlertNotification(reading: SensorReadingDocument, sensor: Sensor): Promise<void> {
    try {
      // Obtener información del minero si existe
      const mineroId = reading.mineroId
      if (!mineroId) return

      const alertData = {
        sensorType: sensor.type,
        sensorName: sensor.name,
        value: reading.value,
        unit: reading.unit,
        threshold: sensor.alertThreshold,
        timestamp: reading.timestamp,
        cascoId: reading.cascoId,
        location: reading.location
      }

      await this.notificationService.sendNotification({
        userId: mineroId,
        type: 'sensor',
        title: `🚨 Alerta de ${sensor.name}`,
        message: `Valor crítico detectado: ${reading.value}${reading.unit}`,
        priority: 'critical',
        data: alertData,
        deliveryChannels: ['database', 'email', 'push']
      })

      console.log(`🚨 Alerta generada para sensor ${sensor.name}: ${reading.value}${reading.unit}`)
    } catch (error) {
      console.error('Error generando notificación de alerta:', error)
    }
  }

  /**
   * Mapear sensor a DTO de respuesta
   */
  private mapSensorToResponse(sensor: Sensor): SensorResponseDto {
    return {
      id: sensor.id,
      cascoId: sensor.cascoId,
      type: sensor.type,
      name: sensor.name,
      isActive: sensor.isActive,
      minValue: sensor.minValue,
      maxValue: sensor.maxValue,
      unit: sensor.unit,
      sampleRate: sensor.sampleRate,
      alertThreshold: sensor.alertThreshold,
      createdAt: sensor.createdAt?.toISO() || new Date().toISOString(),
      updatedAt: sensor.updatedAt?.toISO() || null
    }
  }

  /**
   * Obtener lecturas con filtros
   */
  async getReadings(filters: any): Promise<SensorReadingDocument[]> {
    await this.connect()
    try {
      return await this.readingRepository.findWithFilters(filters)
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Obtener lecturas recientes de un minero
   */
  async getRecentReadings(mineroId: string, minutes: number = 30): Promise<SensorReadingDocument[]> {
    await this.connect()
    try {
      return await this.readingRepository.getRecentReadings(mineroId, minutes)
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Publicar datos de sensor desde dispositivo IoT
   * Guarda en MongoDB, Redis y emite por WebSocket
   */
  async publishSensorData({ cascoId, sensorId, data, deviceToken }: {
    cascoId: string
    sensorId: string
    data: any
    deviceToken: string
  }): Promise<void> {
    await this.connect()
    
    try {
      // 1. Validar token del dispositivo
      await this.validateDeviceToken(deviceToken, cascoId)
      
      // 2. Validar que el sensor existe
      const sensor = await this.sensorRepository.findById(sensorId)
      if (!sensor) {
        throw new Error(`Sensor ${sensorId} no encontrado`)
      }
      
      // 3. Procesar y normalizar los datos
      const normalizedData = this.normalizeSensorData(data, sensor)
      
      // 4. Guardar en MongoDB (histórico)
      await this.readingRepository.create({
        sensorId,
        cascoId,
        mineroId: data.mineroId,
        value: normalizedData.value,
        unit: normalizedData.unit,
        batteryLevel: normalizedData.batteryLevel,
        signalStrength: normalizedData.signalStrength,
        location: normalizedData.location,
        metadata: normalizedData.metadata,
        timestamp: new Date()
      })
      
      // 5. Guardar en Redis (cache últimos 5 minutos)
      await this.saveToRedisCache(cascoId, sensorId, normalizedData)
      
      // 6. Emitir por WebSocket
      await this.emitSensorData(cascoId, sensorId, normalizedData)
      
      console.log(`📡 Datos publicados para sensor ${sensorId} en casco ${cascoId}`)
      
    } finally {
      await this.disconnect()
    }
  }

  /**
   * Validar token del dispositivo
   */
  private async validateDeviceToken(token: string, _cascoId: string): Promise<void> {
    // TODO: Implementar validación real del token
    // Por ahora, validación básica
    if (!token || token.length < 10) {
      throw new Error('Token de dispositivo inválido')
    }
  }

  /**
   * Normalizar datos del sensor
   */
  private normalizeSensorData(data: any, sensor: Sensor): any {
    return {
      value: data.value || 0,
      unit: data.unit || sensor.unit,
      batteryLevel: data.batteryLevel,
      signalStrength: data.signalStrength,
      location: data.location,
      metadata: {
        ...data.metadata,
        deviceId: data.deviceId,
        firmware: data.firmware,
        receivedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Guardar en Redis cache (últimos 5 minutos)
   */
  private async saveToRedisCache(cascoId: string, sensorId: string, _data: any): Promise<void> {
    // TODO: Implementar Redis cuando esté configurado
    // const key = `casco:${cascoId}:sensor:${sensorId}`
    // await redis.lpush(key, JSON.stringify({ ...data, timestamp: Date.now() }))
    // await redis.expire(key, 300) // 5 minutos
    console.log(`💾 Datos guardados en Redis cache para ${cascoId}:${sensorId}`)
  }

  /**
   * Emitir datos por WebSocket
   */
  private async emitSensorData(cascoId: string, sensorId: string, _data: any): Promise<void> {
    // TODO: Implementar WebSocket cuando esté configurado
    // websocketServer.emit(`casco:${cascoId}:sensor:${sensorId}`, data)
    console.log(`📡 Datos emitidos por WebSocket para ${cascoId}:${sensorId}`)
  }

  /**
   * Validar que un casco existe
   */
  async validateCascoExists(cascoId: string): Promise<boolean> {
    try {
      // Usar el repositorio de cascos para verificar existencia
      const casco = await this.cascoRepository.findById(cascoId)
      return casco !== null
    } catch (error) {
      console.error('Error validando existencia del casco:', error)
      return false
    }
  }

  /**
   * Validar que un sensor específico existe en un casco específico
   */
  async validateSensorInCasco(sensorId: string, cascoId: string): Promise<{
    isValid: boolean
    message: string
  }> {
    try {
      // Buscar el sensor por ID
      const sensor = await this.sensorRepository.findById(sensorId)
      
      // Verificar que el sensor existe
      if (!sensor) {
        return {
          isValid: false,
          message: `Sensor ${sensorId} no encontrado`
        }
      }
      
      // Verificar que el sensor pertenece al casco especificado
      if (sensor.cascoId !== cascoId) {
        return {
          isValid: false,
          message: `Sensor ${sensorId} no pertenece al casco ${cascoId}`
        }
      }
      
      // Verificar que el sensor esté activo
      if (!sensor.isActive) {
        return {
          isValid: false,
          message: `Sensor ${sensorId} está inactivo`
        }
      }
      
      return {
        isValid: true,
        message: 'Sensor válido'
      }
    } catch (error) {
      console.error('Error validando sensor en casco:', error)
      return {
        isValid: false,
        message: 'Error interno validando sensor'
      }
    }
  }
}
