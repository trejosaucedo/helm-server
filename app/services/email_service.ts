// services/email_service.ts

import Notification from '#models/notification'

export class EmailService {
  /**
   * Envía contraseña temporal al usuario
   */
  async sendTemporaryPassword(
    email: string,
    temporaryPassword: string,
    fullName?: string
  ): Promise<void> {
    // Simulado
    console.log('=== EMAIL SIMULADO ===')
    console.log(`Para: ${email}`)
    console.log(`Asunto: Bienvenido al Sistema de Minas`)
    console.log(`Mensaje:`)
    console.log(`Hola ${fullName || 'Usuario'},`)
    console.log(``)
    console.log(`Tu cuenta ha sido creada exitosamente.`)
    console.log(``)
    console.log(`Credenciales de acceso:`)
    console.log(`Email: ${email}`)
    console.log(`Contraseña temporal: ${temporaryPassword}`)
    console.log(``)
    console.log(`Por favor, cambia tu contraseña después del primer login.`)
    console.log(``)
    console.log(`Saludos,`)
    console.log(`Sistema de Minas`)
    console.log('=====================')

    // await mail.send('emails/temporary-password', { email, temporaryPassword, fullName })

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  /**
   * Envía token de reset de contraseña
   */
  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    console.log('=== EMAIL RESET PASSWORD ===')
    console.log(`Para: ${email}`)
    console.log(`Token de reset: ${resetToken}`)
    console.log('============================')

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  /**
   * Envía email de notificación según el tipo y prioridad
   */
  async sendNotificationEmail(notification: Notification): Promise<void> {
    // Cargar usuario si no está cargado
    if (!notification.user) {
      await notification.load('user')
    }

    const user = notification.user

    const priorityLabels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica'
    }

    const typeLabels = {
      general: 'General',
      sensor: 'Sensor',
      supervisor: 'Supervisor'
    }

    console.log('=== EMAIL NOTIFICACIÓN ===')
    console.log(`Para: ${user.email}`)
    console.log(`Asunto: [${priorityLabels[notification.priority]}] ${notification.title}`)
    console.log(`Tipo: ${typeLabels[notification.type]}`)
    console.log(`Prioridad: ${priorityLabels[notification.priority]}`)
    console.log(``)
    console.log(`Mensaje:`)
    console.log(`Hola ${user.fullName || user.email},`)
    console.log(``)
    console.log(`${notification.message}`)
    console.log(``)
    
    // Mostrar datos adicionales si existen
    if (notification.data) {
      console.log(`Información adicional:`)
      if (notification.type === 'sensor' && notification.data.sensorType) {
        console.log(`- Sensor: ${notification.data.sensorType}`)
        console.log(`- Valor registrado: ${notification.data.value}${notification.data.unit}`)
        console.log(`- Límite seguro: ${notification.data.threshold}${notification.data.unit}`)
        console.log(`- Hora: ${new Date(notification.data.timestamp).toLocaleString('es-MX')}`)
      } else {
        console.log(`- Datos: ${JSON.stringify(notification.data, null, 2)}`)
      }
      console.log(``)
    }

    console.log(`Fecha: ${notification.createdAt.toFormat('dd/MM/yyyy HH:mm:ss')}`)
    console.log(``)
    console.log(`Saludos,`)
    console.log(`Sistema de Monitoreo de Minas`)
    console.log('==========================')

    // En producción, aquí enviarías el email real
    // await mail.send('emails/notification', {
    //   user,
    //   notification,
    //   priorityColor: priorityColors[notification.priority],
    //   priorityLabel: priorityLabels[notification.priority],
    //   typeLabel: typeLabels[notification.type]
    // })

    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  /**
   * Envía email de resumen diario de notificaciones
   */
  async sendDailyNotificationSummary(
    userEmail: string,
    fullName: string,
    notifications: {
      total: number
      unread: number
      byType: { general: number; sensor: number; supervisor: number }
      byPriority: { low: number; medium: number; high: number; critical: number }
      criticalNotifications: any[]
    }
  ): Promise<void> {
    console.log('=== EMAIL RESUMEN DIARIO ===')
    console.log(`Para: ${userEmail}`)
    console.log(`Asunto: Resumen Diario de Notificaciones - Sistema de Minas`)
    console.log(``)
    console.log(`Hola ${fullName},`)
    console.log(``)
    console.log(`Resumen de notificaciones del día:`)
    console.log(``)
    console.log(`📊 ESTADÍSTICAS:`)
    console.log(`- Total de notificaciones: ${notifications.total}`)
    console.log(`- No leídas: ${notifications.unread}`)
    console.log(``)
    console.log(`📋 POR TIPO:`)
    console.log(`- Generales: ${notifications.byType.general}`)
    console.log(`- Sensores: ${notifications.byType.sensor}`)
    console.log(`- Supervisor: ${notifications.byType.supervisor}`)
    console.log(``)
    console.log(`⚠️  POR PRIORIDAD:`)
    console.log(`- Baja: ${notifications.byPriority.low}`)
    console.log(`- Media: ${notifications.byPriority.medium}`)
    console.log(`- Alta: ${notifications.byPriority.high}`)
    console.log(`- Crítica: ${notifications.byPriority.critical}`)
    console.log(``)

    if (notifications.criticalNotifications.length > 0) {
      console.log(`🚨 ALERTAS CRÍTICAS:`)
      notifications.criticalNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title}`)
        console.log(`   ${notif.message}`)
        console.log(`   Fecha: ${notif.createdAt}`)
        console.log(``)
      })
    }

    console.log(`Ingresa al sistema para revisar tus notificaciones.`)
    console.log(``)
    console.log(`Saludos,`)
    console.log(`Sistema de Monitoreo de Minas`)
    console.log('============================')

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  /**
   * Envía email de alerta crítica inmediata
   */
  async sendCriticalAlert(
    userEmail: string,
    fullName: string,
    notification: Notification
  ): Promise<void> {
    console.log('=== EMAIL ALERTA CRÍTICA ===')
    console.log(`Para: ${userEmail}`)
    console.log(`Asunto: 🚨 ALERTA CRÍTICA - ${notification.title}`)
    console.log(``)
    console.log(`ATENCIÓN ${fullName || 'Usuario'},`)
    console.log(``)
    console.log(`⚠️  ALERTA CRÍTICA DETECTADA ⚠️`)
    console.log(``)
    console.log(`Tipo: ${notification.type.toUpperCase()}`)
    console.log(`Título: ${notification.title}`)
    console.log(`Mensaje: ${notification.message}`)
    console.log(``)
    console.log(`Fecha: ${notification.createdAt.toFormat('dd/MM/yyyy HH:mm:ss')}`)
    console.log(``)
    
    if (notification.data && notification.type === 'sensor') {
      console.log(`DETALLES DEL SENSOR:`)
      console.log(`- Sensor: ${notification.data.sensorType}`)
      console.log(`- Valor: ${notification.data.value}${notification.data.unit}`)
      console.log(`- Límite: ${notification.data.threshold}${notification.data.unit}`)
      console.log(`- Desviación: ${(Math.abs(notification.data.value - notification.data.threshold) / notification.data.threshold * 100).toFixed(1)}%`)
      console.log(``)
    }

    console.log(`ACCIÓN REQUERIDA: Por favor, revisa inmediatamente esta alerta.`)
    console.log(``)
    console.log(`Sistema de Monitoreo de Minas`)
    console.log('=============================')

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  /**
   * Envía email de bienvenida para nuevos usuarios
   */
  async sendWelcomeEmail(
    email: string,
    fullName: string,
    role: string,
    temporaryPassword?: string
  ): Promise<void> {
    console.log('=== EMAIL BIENVENIDA ===')
    console.log(`Para: ${email}`)
    console.log(`Asunto: Bienvenido al Sistema de Monitoreo de Minas`)
    console.log(``)
    console.log(`Hola ${fullName},`)
    console.log(``)
    console.log(`¡Bienvenido al Sistema de Monitoreo de Minas!`)
    console.log(``)
    console.log(`Tu cuenta ha sido creada con el rol de: ${role}`)
    console.log(``)
    
    if (temporaryPassword) {
      console.log(`CREDENCIALES DE ACCESO:`)
      console.log(`Email: ${email}`)
      console.log(`Contraseña temporal: ${temporaryPassword}`)
      console.log(``)
      console.log(`⚠️  IMPORTANTE: Cambia tu contraseña después del primer login.`)
      console.log(``)
    }

    console.log(`FUNCIONALIDADES DISPONIBLES:`)
    console.log(`- Recibir notificaciones del sistema`)
    console.log(`- Monitorear alertas de sensores`)
    console.log(`- Gestionar tu perfil`)
    
    if (role === 'supervisor' || role === 'admin') {
      console.log(`- Enviar notificaciones a otros usuarios`)
      console.log(`- Supervisar equipos de trabajo`)
    }
    
    if (role === 'admin') {
      console.log(`- Administrar usuarios del sistema`)
      console.log(`- Configurar parámetros del sistema`)
    }

    console.log(``)
    console.log(`Si tienes alguna pregunta, no dudes en contactar al administrador.`)
    console.log(``)
    console.log(`¡Que tengas un excelente día!`)
    console.log(``)
    console.log(`Saludos,`)
    console.log(`Sistema de Monitoreo de Minas`)
    console.log('========================')

    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  /**
   * Envía email de confirmación de cuenta
   */
  async sendAccountConfirmation(
    email: string,
    fullName: string,
    confirmationToken: string
  ): Promise<void> {
    console.log('=== EMAIL CONFIRMACIÓN ===')
    console.log(`Para: ${email}`)
    console.log(`Asunto: Confirma tu cuenta - Sistema de Minas`)
    console.log(``)
    console.log(`Hola ${fullName},`)
    console.log(``)
    console.log(`Para completar el registro de tu cuenta, por favor confirma tu email.`)
    console.log(``)
    console.log(`Token de confirmación: ${confirmationToken}`)
    console.log(``)
    console.log(`O haz clic en el siguiente enlace:`)
    console.log(`[ENLACE DE CONFIRMACIÓN]`)
    console.log(``)
    console.log(`Este enlace expira en 24 horas.`)
    console.log(``)
    console.log(`Si no solicitaste esta cuenta, puedes ignorar este mensaje.`)
    console.log(``)
    console.log(`Saludos,`)
    console.log(`Sistema de Monitoreo de Minas`)
    console.log('==========================')

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  /**
   * Envía email cuando un usuario marca una notificación como errónea
   */
  async sendErrorReportNotification(
    adminEmail: string,
    userWhoReported: string,
    notification: Notification,
    errorComment?: string
  ): Promise<void> {
    console.log('=== EMAIL REPORTE ERROR ===')
    console.log(`Para: ${adminEmail}`)
    console.log(`Asunto: Reporte de Error en Notificación`)
    console.log(``)
    console.log(`Hola Administrador,`)
    console.log(``)
    console.log(`Un usuario ha reportado una notificación como errónea.`)
    console.log(``)
    console.log(`DETALLES DEL REPORTE:`)
    console.log(`- Usuario que reportó: ${userWhoReported}`)
    console.log(`- ID de notificación: ${notification.id}`)
    console.log(`- Tipo: ${notification.type}`)
    console.log(`- Título: ${notification.title}`)
    console.log(`- Mensaje: ${notification.message}`)
    console.log(`- Fecha de creación: ${notification.createdAt.toFormat('dd/MM/yyyy HH:mm:ss')}`)
    console.log(``)
    
    if (errorComment) {
      console.log(`COMENTARIO DEL USUARIO:`)
      console.log(`"${errorComment}"`)
      console.log(``)
    }

    console.log(`Por favor, revisa esta notificación para mejorar el sistema.`)
    console.log(``)
    console.log(`Sistema de Monitoreo de Minas`)
    console.log('===========================')

    await new Promise((resolve) => setTimeout(resolve, 120))
  }

  /**
   * Método genérico para enviar emails personalizados
   */
  async sendCustomEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<void> {
    console.log('=== EMAIL PERSONALIZADO ===')
    console.log(`Para: ${to}`)
    console.log(`Asunto: ${subject}`)
    console.log(``)
    console.log(`Contenido HTML:`)
    console.log(htmlContent)
    console.log(``)
    
    if (textContent) {
      console.log(`Contenido Texto:`)
      console.log(textContent)
    }
    
    console.log('===========================')

    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}