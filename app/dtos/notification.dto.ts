export interface CreateNotificationDto {
  userId: string
  type: 'sensor_alert' | 'system' | 'supervisor_message'
  title: string
  message: string
  priority?: string
  data?: any
}

export interface NotificationResponseDto {
  id: string
  userId: string
  type: 'sensor_alert' | 'system' | 'supervisor_message'
  title: string
  message: string
  priority: string
  isRead: boolean
  data: any
  createdAt: string
  updatedAt: string | null
}

export interface NotificationFiltersDto {
  type?: 'sensor_alert' | 'system' | 'supervisor_message'
  isRead?: boolean
  priority?: string
  page?: number
  limit?: number
}
