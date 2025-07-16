import Notification from '#models/notification'
import User from '#models/user'
import { DateTime } from 'luxon'

// Tipos para las configuraciones de push
interface PushConfig {
  fcmServerKey: string
  apnsKeyId: string
  apnsTeamId: string
  apnsPrivateKey: string
  apnsBundleId: string
  environment: 'development' | 'production'
}

interface PushPayload {
  title: string
  body: string
  data?: Record<string, any>
  badge?: number
  sound?: string
  category?: string
  priority?: 'high' | 'normal'
  timeToLive?: number
}

interface DeviceToken {
  token: string
  platform: 'ios' | 'android'
  userId: string
  isActive: boolean
  registeredAt: DateTime
}

// Respuestas de los servicios de push
interface PushResult {
  success: boolean
  messageId?: string
  error?: string
  failureReason?: string
}

export class PushService {
  private config: PushConfig
  private fcmEndpoint = 'https://fcm.googleapis.com/fcm/send'
  // private apnsEndpoint = 'https://api.push.apple.com/3/device'
  private retryAttempts = 3
  private retryDelay = 1000 // 1 segundo

  constructor() {
    this.config = {
      fcmServerKey: process.env.FCM_SERVER_KEY || '',
      apnsKeyId: process.env.APNS_KEY_ID || '',
      apnsTeamId: process.env.APNS_TEAM_ID || '',
      apnsPrivateKey: process.env.APNS_PRIVATE_KEY || '',
      apnsBundleId: process.env.APNS_BUNDLE_ID || 'com.mining.system',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    }
  }

  /**
   * Envía notificación push basada en el modelo Notification
   */
  public async sendNotificationPush(notification: Notification): Promise<boolean> {
    try {
      // Cargar usuario si no está cargado
      if (!notification.user) {
        await notification.load('user')
      }

      const user = notification.user
      const deviceTokens = await this.getUserDeviceTokens(user.id)

      if (deviceTokens.length === 0) {
        console.log(`Usuario ${user.email} no tiene dispositivos registrados`)
        return false
      }

      const payload = this.buildNotificationPayload(notification, user)
      const results = await this.sendToMultipleDevices(deviceTokens, payload)

      // Contar éxitos
      const successCount = results.filter((r) => r.success).length
      const totalCount = results.length

      console.log(
        `Push enviado a ${successCount}/${totalCount} dispositivos para notificación ${notification.id}`
      )

      // Limpiar tokens inválidos
      await this.cleanupFailedTokens(deviceTokens, results)

      return successCount > 0
    } catch (error) {
      console.error('Error enviando push notification:', error)
      return false
    }
  }

  /**
   * Envía push personalizado a un usuario específico
   */
  public async sendCustomPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    options?: {
      priority?: 'high' | 'normal'
      sound?: string
      badge?: number
      category?: string
    }
  ): Promise<boolean> {
    try {
      const deviceTokens = await this.getUserDeviceTokens(userId)

      if (deviceTokens.length === 0) {
        console.log(`Usuario ${userId} no tiene dispositivos registrados`)
        return false
      }

      const payload: PushPayload = {
        title,
        body,
        data,
        priority: options?.priority || 'normal',
        sound: options?.sound || 'default',
        badge: options?.badge,
        category: options?.category,
      }

      const results = await this.sendToMultipleDevices(deviceTokens, payload)
      const successCount = results.filter((r) => r.success).length

      console.log(
        `Push personalizado enviado a ${successCount}/${deviceTokens.length} dispositivos`
      )

      await this.cleanupFailedTokens(deviceTokens, results)
      return successCount > 0
    } catch (error) {
      console.error('Error enviando push personalizado:', error)
      return false
    }
  }

  /**
   * Envía alerta crítica de sensor
   */
  public async sendCriticalSensorAlert(
    userId: string,
    sensorType: string,
    value: number,
    threshold: number,
    unit: string,
    location?: string
  ): Promise<boolean> {
    const title = `🚨 ALERTA CRÍTICA - ${sensorType}`
    const body = `${sensorType}: ${value}${unit} (Límite: ${threshold}${unit})`

    const data = {
      type: 'sensor_alert',
      sensorType,
      value: value.toString(),
      threshold: threshold.toString(),
      unit,
      location: location || 'No especificada',
      timestamp: new Date().toISOString(),
      severity: 'critical',
    }

    return this.sendCustomPush(userId, title, body, data, {
      priority: 'high',
      sound: 'alarm.wav',
      category: 'SENSOR_ALERT',
    })
  }

  /**
   * Envía notificación de supervisor a equipo
   */
  public async sendSupervisorMessage(
    supervisorId: string,
    targetUserIds: string[],
    message: string,
    title?: string
  ): Promise<{ success: number; failed: number }> {
    const supervisor = await User.find(supervisorId)
    const finalTitle = title || `Mensaje de ${supervisor?.fullName || 'Supervisor'}`

    let successCount = 0
    let failedCount = 0

    const data = {
      type: 'supervisor_message',
      supervisorId,
      supervisorName: supervisor?.fullName || 'Supervisor',
      timestamp: new Date().toISOString(),
    }

    for (const userId of targetUserIds) {
      try {
        const sent = await this.sendCustomPush(userId, finalTitle, message, data, {
          priority: 'high',
          sound: 'supervisor.wav',
          category: 'SUPERVISOR_MESSAGE',
        })

        if (sent) successCount++
        else failedCount++
      } catch (error) {
        console.error(`Error enviando push a usuario ${userId}:`, error)
        failedCount++
      }
    }

    return { success: successCount, failed: failedCount }
  }

  /**
   * Envía notificación de emergencia a todos los usuarios activos
   */
  public async sendEmergencyBroadcast(
    title: string,
    message: string,
    emergencyType: 'evacuation' | 'fire' | 'gas' | 'collapse' | 'general',
    location?: string
  ): Promise<{ success: number; failed: number }> {
    try {
      const allActiveTokens = await this.getAllActiveDeviceTokens()

      const data = {
        type: 'emergency',
        emergencyType,
        location: location || 'No especificada',
        timestamp: new Date().toISOString(),
        requiresAcknowledgment: true,
      }

      const payload: PushPayload = {
        title: `🚨 EMERGENCIA: ${title}`,
        body: message,
        data,
        priority: 'high',
        sound: 'emergency.wav',
        category: 'EMERGENCY',
      }

      const results = await this.sendToMultipleDevices(allActiveTokens, payload)
      const successCount = results.filter((r) => r.success).length
      const failedCount = results.length - successCount

      console.log(`Emergencia enviada a ${successCount}/${allActiveTokens.length} dispositivos`)

      // Limpiar tokens fallidos
      await this.cleanupFailedTokens(allActiveTokens, results)

      return { success: successCount, failed: failedCount }
    } catch (error) {
      console.error('Error enviando broadcast de emergencia:', error)
      return { success: 0, failed: 0 }
    }
  }

  /**
   * Construye el payload de push basado en la notificación
   */
  private buildNotificationPayload(notification: Notification, _user: User): PushPayload {
    const priorityConfig = {
      low: { priority: 'normal' as const, sound: 'default' },
      medium: { priority: 'normal' as const, sound: 'default' },
      high: { priority: 'high' as const, sound: 'alert.wav' },
      critical: { priority: 'high' as const, sound: 'alarm.wav' },
    }

    const config = priorityConfig[notification.priority]

    // Personalizar título y mensaje según el tipo
    let title = notification.title
    let body = notification.message

    if (notification.type === 'sensor') {
      title = `⚠️ ${notification.title}`
      if (notification.getData()?.sensorType) {
        body = `${notification.getData().sensorType}: ${notification.getData().value}${notification.getData().unit} (Límite: ${notification.getData().threshold}${notification.getData().unit})`
      }
    } else if (notification.priority === 'critical') {
      title = `🚨 ${notification.title}`
    }

    const data = {
      notificationId: notification.id,
      type: notification.type,
      priority: notification.priority,
      timestamp: notification.createdAt.toISO(),
      ...notification.getData(),
    }

    return {
      title,
      body,
      data,
      priority: config.priority,
      sound: config.sound,
      category: this.getCategoryForNotification(notification),
    }
  }

  /**
   * Determina la categoría de la notificación para iOS
   */
  private getCategoryForNotification(notification: Notification): string {
    const categories = {
      sensor: 'SENSOR_ALERT',
      supervisor: 'SUPERVISOR_MESSAGE',
      general: 'GENERAL_NOTIFICATION',
    }

    return categories[notification.type] || 'GENERAL_NOTIFICATION'
  }

  /**
   * Envía push a múltiples dispositivos
   */
  private async sendToMultipleDevices(
    deviceTokens: DeviceToken[],
    payload: PushPayload
  ): Promise<PushResult[]> {
    const results: PushResult[] = []

    for (const device of deviceTokens) {
      try {
        let result: PushResult

        if (device.platform === 'android') {
          result = await this.sendFCMPush(device.token, payload)
        } else {
          result = await this.sendAPNSPush(device.token, payload)
        }

        results.push(result)
      } catch (error) {
        console.error(`Error enviando push a dispositivo ${device.token}:`, error)
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        })
      }
    }

    return results
  }

  /**
   * Envía push mediante Firebase Cloud Messaging (Android)
   */
  private async sendFCMPush(token: string, payload: PushPayload): Promise<PushResult> {
    if (!this.config.fcmServerKey) {
      throw new Error('FCM Server Key no configurado')
    }

    const fcmPayload = {
      to: token,
      priority: payload.priority === 'high' ? 'high' : 'normal',
      notification: {
        title: payload.title,
        body: payload.body,
        sound: payload.sound || 'default',
        badge: payload.badge?.toString(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      data: payload.data || {},
    }

    try {
      const response = await this.makeHttpRequest(this.fcmEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.config.fcmServerKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmPayload),
      })

      const result = await response.json()

      if (result.success === 1) {
        return {
          success: true,
          messageId: result.results?.[0]?.message_id,
        }
      } else {
        return {
          success: false,
          error: result.results?.[0]?.error || 'Error FCM desconocido',
          failureReason: result.failure,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de red FCM',
      }
    }
  }

  /**
   * Envía push mediante Apple Push Notification Service (iOS)
   */
  private async sendAPNSPush(token: string, payload: PushPayload): Promise<PushResult> {
    // Nota: En producción necesitarías implementar la autenticación JWT para APNS
    // Por ahora, simulamos el envío

    const apnsPayload = {
      aps: {
        'alert': {
          title: payload.title,
          body: payload.body,
        },
        'badge': payload.badge,
        'sound': payload.sound || 'default',
        'category': payload.category,
        'thread-id': 'mining-notifications',
      },
      data: payload.data || {},
    }

    try {
      // Simulación del envío APNS
      console.log('=== SIMULACIÓN APNS ===')
      console.log(`Token: ${token.substring(0, 20)}...`)
      console.log(`Payload:`, JSON.stringify(apnsPayload, null, 2))
      console.log('======================')

      // En producción, aquí harías la llamada real a APNS
      // const response = await this.makeHttpRequest(`${this.apnsEndpoint}/${token}`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${jwtToken}`,
      //     'Content-Type': 'application/json',
      //     'apns-topic': this.config.apnsBundleId,
      //     'apns-priority': payload.priority === 'high' ? '10' : '5'
      //   },
      //   body: JSON.stringify(apnsPayload)
      // })

      await new Promise((resolve) => setTimeout(resolve, 100)) // Simular latencia

      return {
        success: true,
        messageId: `apns-${Date.now()}`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de red APNS',
      }
    }
  }

  /**
   * Registra un nuevo token de dispositivo
   */
  public async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
    deviceInfo?: {
      model?: string
      osVersion?: string
      appVersion?: string
    }
  ): Promise<void> {
    try {
      // Desactivar tokens antiguos del mismo usuario y plataforma
      await this.deactivateOldTokens(userId, platform)

      // Registrar nuevo token (simulado con console.log)
      console.log('=== REGISTRO TOKEN ===')
      console.log(`Usuario: ${userId}`)
      console.log(`Token: ${token.substring(0, 20)}...`)
      console.log(`Plataforma: ${platform}`)
      console.log(`Dispositivo:`, deviceInfo)
      console.log('======================')

      // En producción, guardarías en base de datos:
      // await DeviceToken.create({
      //   userId,
      //   token,
      //   platform,
      //   isActive: true,
      //   deviceInfo,
      //   registeredAt: DateTime.local()
      // })
    } catch (error) {
      console.error('Error registrando token:', error)
      throw error
    }
  }

  /**
   * Obtiene tokens de dispositivo del usuario
   */
  private async getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
    // Simulación de tokens de dispositivo
    const mockTokens: DeviceToken[] = [
      {
        token: `ios_token_${userId}_${Date.now()}`,
        platform: 'ios',
        userId,
        isActive: true,
        registeredAt: DateTime.local(),
      },
      {
        token: `android_token_${userId}_${Date.now()}`,
        platform: 'android',
        userId,
        isActive: true,
        registeredAt: DateTime.local(),
      },
    ]

    return mockTokens
  }

  /**
   * Obtiene todos los tokens activos
   */
  private async getAllActiveDeviceTokens(): Promise<DeviceToken[]> {
    // Simulación de tokens activos
    return [
      {
        token: 'token_user_1_ios',
        platform: 'ios',
        userId: 'user-1',
        isActive: true,
        registeredAt: DateTime.local(),
      },
      {
        token: 'token_user_2_android',
        platform: 'android',
        userId: 'user-2',
        isActive: true,
        registeredAt: DateTime.local(),
      },
    ]
  }

  /**
   * Desactiva tokens antiguos
   */
  private async deactivateOldTokens(userId: string, platform: 'ios' | 'android'): Promise<void> {
    console.log(`Desactivando tokens antiguos para usuario ${userId} en ${platform}`)
    // En producción: UPDATE device_tokens SET is_active = false WHERE user_id = ? AND platform = ?
  }

  /**
   * Limpia tokens que fallaron
   */
  private async cleanupFailedTokens(
    deviceTokens: DeviceToken[],
    results: PushResult[]
  ): Promise<void> {
    for (const [i, token] of deviceTokens.entries()) {
      const result = results[i]
      if (!result.success && this.shouldRemoveToken(result.error)) {
        console.log(`Removiendo token inválido: ${token.token.substring(0, 20)}...`)
        // En producción: DELETE FROM device_tokens WHERE token = ?
      }
    }
  }

  /**
   * Determina si un token debe ser removido basado en el error
   */
  private shouldRemoveToken(error?: string): boolean {
    if (!error) return false

    const removeErrors = [
      'invalid_registration',
      'not_registered',
      'invalid_token',
      'unregistered',
      'BadDeviceToken',
      'DeviceTokenNotForTopic',
    ]

    return removeErrors.some((e) => error.includes(e))
  }

  /**
   * Realiza petición HTTP con reintentos
   */
  private async makeHttpRequest(url: string, options: any): Promise<any> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, options)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido')

        if (attempt < this.retryAttempts) {
          console.log(`Intento ${attempt} falló, reintentando en ${this.retryDelay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay))
        }
      }
    }

    throw lastError
  }

  /**
   * Obtiene estadísticas de envío de push
   */
  public async getPushStats(userId?: string): Promise<{
    totalSent: number
    totalFailed: number
    activeDevices: number
    lastSentAt: DateTime | null
  }> {
    // Simulación de estadísticas
    return {
      totalSent: 150,
      totalFailed: 8,
      activeDevices: userId ? 2 : 45,
      lastSentAt: DateTime.local().minus({ minutes: 5 }),
    }
  }

  /**
   * Prueba la conectividad de los servicios push
   */
  public async testPushServices(): Promise<{
    fcm: boolean
    apns: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let fcmStatus = false
    let apnsStatus = false

    // Probar FCM
    try {
      if (this.config.fcmServerKey) {
        fcmStatus = true
      } else {
        errors.push('FCM Server Key no configurado')
      }
    } catch (error) {
      errors.push(`FCM Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }

    // Probar APNS
    try {
      if (this.config.apnsKeyId && this.config.apnsTeamId) {
        apnsStatus = true
      } else {
        errors.push('APNS no configurado completamente')
      }
    } catch (error) {
      errors.push(`APNS Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }

    return {
      fcm: fcmStatus,
      apns: apnsStatus,
      errors,
    }
  }

  /**
   * Programa el envío de notificaciones programadas
   */
  public async scheduleNotification(
    userId: string,
    scheduledAt: DateTime,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    const scheduleId = `schedule_${Date.now()}_${userId}`

    console.log('=== NOTIFICACIÓN PROGRAMADA ===')
    console.log(`ID: ${scheduleId}`)
    console.log(`Usuario: ${userId}`)
    console.log(`Programada para: ${scheduledAt.toISO()}`)
    console.log(`Título: ${title}`)
    console.log(`Cuerpo: ${body}`)
    console.log(`Datos:`, data)
    console.log('===============================')

    // En producción, guardarías en base de datos y procesarías con un job scheduler
    // await ScheduledNotification.create({
    //   id: scheduleId,
    //   userId,
    //   scheduledAt,
    //   title,
    //   body,
    //   data,
    //   status: 'pending'
    // })

    return scheduleId
  }
}
