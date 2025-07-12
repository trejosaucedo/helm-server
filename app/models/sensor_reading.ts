import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Sensor from './sensor.js'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * Modelo para lecturas de sensores
 */
export default class SensorReading extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare sensorId: string

  @column()
  declare cascoId: string // Para consultas más rápidas

  @column()
  declare mineroId: string // Para consultas más rápidas

  @column()
  declare value: number // Valor de la lectura

  @column()
  declare unit: string // Unidad de medida

  @column()
  declare isNormal: boolean // Si está dentro del rango normal

  @column()
  declare isAlert: boolean // Si genera alerta crítica

  @column()
  declare batteryLevel: number | null // Nivel de batería del sensor

  @column()
  declare signalStrength: number | null // Intensidad de señal

  @column()
  declare location: string | null // Coordenadas GPS (JSON string)

  @column()
  declare metadata: string | null // Datos adicionales (JSON string)

  @column.dateTime()
  declare timestamp: DateTime // Momento de la lectura

  @column.dateTime()
  declare receivedAt: DateTime // Momento de recepción en el servidor

  // Relaciones
  @belongsTo(() => Sensor, {
    foreignKey: 'sensorId',
  })
  declare sensor: BelongsTo<typeof Sensor>

  @belongsTo(() => User, {
    foreignKey: 'mineroId',
  })
  declare minero: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
