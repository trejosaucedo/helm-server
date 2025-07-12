export interface CreateNotificationDto {
  userId: string
  type: string // Ej: 'alerta_sensor', 'asignacion', 'mensaje', etc.
  mensaje: string
  data?: string // JSON.stringify de info extra
  canal: string // 'app', 'correo', 'push', 'web', etc.
}

export interface NotificationResponseDto {
  id: string
  userId: string
  type: string
  mensaje: string
  data: string | null
  canal: string
  read: boolean
  fechaEnvio: string
  fechaLeido: string | null
  createdAt: string
  updatedAt: string | null
}
