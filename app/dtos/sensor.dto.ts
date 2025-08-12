export interface CreateSensorDto {
  cascoId: string
  type: 'gps' | 'heart_rate' | 'body_temperature' | 'gas'
  name: string
  minValue?: number
  maxValue?: number
  unit: string
  sampleRate?: number
  alertThreshold?: number
}

export interface UpdateSensorDto {
  name?: string
  minValue?: number
  maxValue?: number
  unit?: string
  sampleRate?: number
  alertThreshold?: number
  isActive?: boolean
}

export interface SensorResponseDto {
  id: string
  cascoId: string
  type: 'gps' | 'heart_rate' | 'body_temperature' | 'gas'
  name: string
  isActive: boolean
  minValue: number | null
  maxValue: number | null
  unit: string
  sampleRate: number
  alertThreshold: number | null
  createdAt: string
  updatedAt: string | null
}

export interface CreateSensorReadingDto {
  id?: string // ID local del dispositivo
  sensorId: string
  sensorLocalId?: string // ID local del sensor en el dispositivo
  cascoId: string
  mineroId: string
  value: number
  unit: string
  batteryLevel?: number
  signalStrength?: number
  location?: string
  metadata?: Record<string, any>
  timestamp?: string | Date
}

export interface SensorReadingResponseDto {
  id: string
  localId?: string // ID local del dispositivo 
  sensorId: string
  sensorLocalId?: string // ID local del sensor en el dispositivo
  cascoId: string
  mineroId: string
  value: number
  unit: string
  isNormal: boolean
  isAlert: boolean
  batteryLevel: number | null
  signalStrength: number | null
  location: string | null
  metadata: string | null
  timestamp: string
  receivedAt: string
  createdAt: string
  updatedAt: string | null
}

export interface SensorReadingFiltersDto {
  cascoId?: string
  mineroId?: string
  sensorType?: 'gps' | 'heart_rate' | 'body_temperature' | 'gas'
  startDate?: string
  endDate?: string
  isAlert?: boolean
  limit?: number
  offset?: number
}

export interface SensorStatsDto {
  sensorId: string
  avgValue: number
  minValue: number
  maxValue: number
  readingCount: number
  alertCount: number
  lastReading: string
  trend: 'up' | 'down' | 'stable'
}
