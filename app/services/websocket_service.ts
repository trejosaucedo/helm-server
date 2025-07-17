import { Server, Socket } from 'socket.io'
import { SensorReading, Alert } from '#types/sensor'

export class WebSocketService {
  private io: Server

  constructor(io: Server) {
    this.io = io
  }

  /**
   * Emitir lecturas de sensores en tiempo real
   */
  emitSensorReading(reading: SensorReading) {
    // Emitir al canal específico del minero y su equipo
    // El equipo ya está suscrito al canal minero:${reading.mineroId}
    this.io.to(`minero:${reading.mineroId}`).emit('sensor-reading', reading)
    
    // Si es una lectura crítica, emitir alerta
    if (this.isReadingCritical(reading)) {
      this.emitAlert(reading)
    }
  }

  /**
   * Emitir alerta por lectura crítica
   */
  private emitAlert(reading: SensorReading) {
    const alert: Alert = {
      type: 'sensor-alert',
      mineroId: reading.mineroId,
      sensorType: reading.type,
      value: reading.value,
      timestamp: reading.timestamp,
      message: this.getAlertMessage(reading)
    }

    // Emitir a minero y supervisor
    this.io.to(`minero:${reading.mineroId}`).emit('alert', alert)
    this.io.to('supervisores').emit('alert', alert)
  }

  /**
   * Verificar si una lectura es crítica
   */
  private isReadingCritical(reading: SensorReading): boolean {
    switch (reading.type) {
      case 'heart_rate':
        return reading.value > 120 || reading.value < 50
      case 'body_temperature':
        return reading.value > 38 || reading.value < 35
      case 'gas':
        return reading.value > 50 // PPM límite
      default:
        return false
    }
  }

  /**
   * Generar mensaje de alerta según tipo de sensor
   */
  private getAlertMessage(reading: SensorReading): string {
    switch (reading.type) {
      case 'heart_rate':
        return `Ritmo cardíaco anormal: ${reading.value} BPM`
      case 'body_temperature':
        return `Temperatura corporal crítica: ${reading.value}°C`
      case 'gas':
        return `Nivel de gas peligroso: ${reading.value} PPM`
      default:
        return 'Alerta de sensor'
    }
  }

  /**
   * Manejar conexión de nuevo cliente
   */
  handleConnection(socket: Socket) {
    const { user } = socket.data
    console.log(`Cliente conectado: ${user.name} (${user.role})`)

    // Unir a salas según rol y equipo
    if (user.role === 'minero') {
      socket.join(`minero:${user.id}`)
    } else if (user.role === 'supervisor') {
      socket.join('supervisores')
    }

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${user.name}`)
    })
  }
}
