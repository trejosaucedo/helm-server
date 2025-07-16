export interface SensorReading {
  id?: string
  sensorId: string
  cascoId: string
  mineroId: string
  type: 'heart_rate' | 'body_temperature' | 'gas' | 'gps'
  value: number
  unit: string
  timestamp: string
  metadata?: any
}

export interface Alert {
  id?: string
  type: 'sensor-alert' | 'system-alert'
  mineroId: string
  sensorType?: string
  value?: number
  message: string
  timestamp: string
  status?: 'pending' | 'acknowledged' | 'resolved'
  metadata?: any
}
