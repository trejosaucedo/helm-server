import { SensorRepository } from '#repositories/sensor_repository'
import { SensorReadingRepository } from '#repositories/sensor_reading_repository'
import { NotificationService } from '#services/notification_service'
import type {
  CreateSensorDto,
  UpdateSensorDto,
  SensorResponseDto,
  CreateSensorReadingDto,
  SensorReadingResponseDto,
  SensorReadingFiltersDto,
  SensorStatsDto,
} from '#dtos/sensor.dto'

export class SensorService {
  private sensorRepository: SensorRepository
  private readingRepository: SensorReadingRepository
  private notificationService: NotificationService

  constructor() {
    this.sensorRepository = new SensorRepository()
    this.readingRepository = new SensorReadingRepository()
    this.notificationService = new NotificationService()
  }

  /**
   * Crea un nuevo sensor
   */
  async createSensor(data: CreateSensorDto): Promise<SensorResponseDto> {
    const sensor = await this.sensorRepository.create(data)
    return this.mapSensorToResponse(sensor)
  }

  /**
   * Actualiza un sensor existente
   */
  async updateSensor(id: string, data: UpdateSensorDto): Promise<SensorResponseDto | null> {
    const sensor = await this.sensorRepository.update(id, data)
    if (!sensor) return null
    return this.mapSensorToResponse(sensor)
  }

  /**
   * Obtiene sensores por casco
   */
  async getSensorsByCasco(cascoId: string): Promise<SensorResponseDto[]> {
    const sensors = await this.sensorRepository.findByCascoId(cascoId)
    return sensors.map(sensor => this.mapSensorToResponse(sensor))
  }

  /**
   * Obtiene sensores por minero
   */
  async getSensorsByMinero(mineroId: string): Promise<SensorResponseDto[]> {
    const sensors = await this.sensorRepository.getSensorsByMinero(mineroId)
    return sensors.map(sensor => this.mapSensorToResponse(sensor))
  }

  /**
   * Ingesta una nueva lectura de sensor
   */
  async ingestReading(data: CreateSensorReadingDto): Promise<SensorReadingResponseDto> {
    // Crear la lectura
    const reading = await this.readingRepository.create(data)
    
    // Obtener el sensor para validar rangos
    const sensor = await this.sensorRepository.findById(data.sensorId)
    if (!sensor) {
      throw new Error('Sensor no encontrado')
    }

    // Evaluar si la lectura está dentro del rango normal
    const { isNormal, isAlert } = this.evaluateReading(reading.value, sensor)
    
    // Actualizar el estado de la lectura
    await this.readingRepository.updateAlertStatus(reading.id, isAlert, isNormal)

    // Si es una alerta, generar notificación
    if (isAlert) {
      await this.generateAlertNotification(reading, sensor)
    }

    return this.mapReadingToResponse(reading)
  }

  /**
   * Ingesta múltiples lecturas en batch
   */
  async ingestBatchReadings(readings: CreateSensorReadingDto[]): Promise<SensorReadingResponseDto[]> {
    const results: SensorReadingResponseDto[] = []
    
    for (const readingData of readings) {
      try {
        const result = await this.ingestReading(readingData)
        results.push(result)
      } catch (error) {
        console.error(`Error procesando lectura del sensor ${readingData.sensorId}:`, error)
        // Continuar con las demás lecturas
      }
    }
    
    return results
  }

  /**
   * Obtiene lecturas con filtros
   */
  async getReadings(filters: SensorReadingFiltersDto): Promise<SensorReadingResponseDto[]> {
    const readings = await this.readingRepository.findWithFilters(filters)
    return readings.map(reading => this.mapReadingToResponse(reading))
  }

  /**
   * Obtiene lecturas recientes de un minero
   */
  async getRecentReadings(mineroId: string, minutes: number = 30): Promise<SensorReadingResponseDto[]> {
    const readings = await this.readingRepository.getRecentReadings(mineroId, minutes)
    return readings.map(reading => this.mapReadingToResponse(reading))
  }

  /**
   * Obtiene estadísticas de un sensor
   */
  async getSensorStats(sensorId: string, hours: number = 24): Promise<SensorStatsDto> {
    const stats = await this.readingRepository.getStatsForSensor(sensorId, hours)
    const lastReading = await this.readingRepository.getLatestReadingBySensor(sensorId)
    const trend = await this.calculateTrend(sensorId, hours)
    
    return {
      sensorId,
      ...stats,
      lastReading: lastReading?.timestamp.toISO() || '',
      trend,
    }
  }

  /**
   * Evalúa si una lectura está dentro del rango normal
   */
  private evaluateReading(value: number, sensor: any): { isNormal: boolean; isAlert: boolean } {
    let isNormal = true
    let isAlert = false

    // Verificar rango normal
    if (sensor.minValue !== null && value < sensor.minValue) {
      isNormal = false
    }
    if (sensor.maxValue !== null && value > sensor.maxValue) {
      isNormal = false
    }

    // Verificar umbral de alerta crítica
    if (sensor.alertThreshold !== null) {
      if (sensor.type === 'heart_rate') {
        // Para frecuencia cardíaca, alerta si está fuera del rango seguro
        isAlert = value > sensor.alertThreshold || value < (sensor.alertThreshold * 0.5)
      } else if (sensor.type === 'gas') {
        // Para gas, alerta si supera el umbral
        isAlert = value > sensor.alertThreshold
      } else if (sensor.type === 'body_temperature') {
        // Para temperatura corporal, alerta si está fuera del rango
        isAlert = value > sensor.alertThreshold || value < (sensor.alertThreshold - 5)
      }
    }

    return { isNormal, isAlert }
  }

  /**
   * Genera notificación de alerta
   */
  private async generateAlertNotification(reading: any, sensor: any): Promise<void> {
    try {
      let title = ''
      let message = ''
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'high'

      switch (sensor.type) {
        case 'heart_rate':
          title = '⚠️ Alerta de Frecuencia Cardíaca'
          message = `Frecuencia cardíaca anormal detectada: ${reading.value} ${sensor.unit}`
          priority = 'critical'
          break
        case 'gas':
          title = '🚨 Alerta de Gas Peligroso'
          message = `Nivel de gas peligroso detectado: ${reading.value} ${sensor.unit}`
          priority = 'critical'
          break
        case 'body_temperature':
          title = '🌡️ Alerta de Temperatura Corporal'
          message = `Temperatura corporal anormal: ${reading.value} ${sensor.unit}`
          priority = 'high'
          break
        default:
          title = '⚠️ Alerta de Sensor'
          message = `Lectura anormal en sensor ${sensor.name}: ${reading.value} ${sensor.unit}`
          priority = 'medium'
      }

      await this.notificationService.sendNotification({
        userId: reading.mineroId,
        type: 'sensor',
        title,
        message,
        priority,
        deliveryChannels: ['database', 'push', 'email'],
        data: {
          sensorId: sensor.id,
          sensorType: sensor.type,
          value: reading.value,
          unit: sensor.unit,
          threshold: sensor.alertThreshold,
          timestamp: reading.timestamp.toISO(),
        },
      })
    } catch (error) {
      console.error('Error generando notificación de alerta:', error)
    }
  }

  /**
   * Calcula tendencia de un sensor
   */
  private async calculateTrend(sensorId: string, _hours: number): Promise<'up' | 'down' | 'stable'> {
    // Implementación básica - puede mejorarse con análisis más sofisticado
    const readings = await this.readingRepository.findBySensorId(sensorId, 10)
    
    if (readings.length < 2) return 'stable'
    
    const recent = readings.slice(0, 5)
    const older = readings.slice(5, 10)
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((sum, r) => sum + r.value, 0) / recent.length
    const olderAvg = older.reduce((sum, r) => sum + r.value, 0) / older.length
    
    const diff = recentAvg - olderAvg
    const threshold = olderAvg * 0.05 // 5% de diferencia
    
    if (diff > threshold) return 'up'
    if (diff < -threshold) return 'down'
    return 'stable'
  }

  /**
   * Mapea sensor a DTO de respuesta
   */
  private mapSensorToResponse(sensor: any): SensorResponseDto {
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
      createdAt: sensor.createdAt.toISO(),
      updatedAt: sensor.updatedAt?.toISO() || null,
    }
  }

  /**
   * Mapea lectura a DTO de respuesta
   */
  private mapReadingToResponse(reading: any): SensorReadingResponseDto {
    return {
      id: reading.id,
      sensorId: reading.sensorId,
      cascoId: reading.cascoId,
      mineroId: reading.mineroId,
      value: reading.value,
      unit: reading.unit,
      isNormal: reading.isNormal,
      isAlert: reading.isAlert,
      batteryLevel: reading.batteryLevel,
      signalStrength: reading.signalStrength,
      location: reading.location,
      metadata: reading.metadata,
      timestamp: reading.timestamp.toISO(),
      receivedAt: reading.receivedAt.toISO(),
      createdAt: reading.createdAt.toISO(),
      updatedAt: reading.updatedAt?.toISO() || null,
    }
  }
}
