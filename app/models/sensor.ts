import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import Casco from './casco.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

/**
 * Modelo para sensores - cada casco tiene 4 sensores
 */
export default class Sensor extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare cascoId: string

  @column()
  declare type: 'gps' | 'heart_rate' | 'body_temperature' | 'gas'

  @column()
  declare name: string // Nombre descriptivo del sensor

  @column()
  declare isActive: boolean

  @column()
  declare minValue: number | null // Valor mínimo del rango normal

  @column()
  declare maxValue: number | null // Valor máximo del rango normal

  @column()
  declare unit: string // Unidad de medida (bpm, °C, ppm, etc.)

  @column()
  declare sampleRate: number // Frecuencia de muestreo en segundos

  @column()
  declare alertThreshold: number | null // Umbral para generar alerta crítica

  // Relaciones
  @belongsTo(() => Casco, {
    foreignKey: 'cascoId',
  })
  declare casco: BelongsTo<typeof Casco>

  // Nota: La relación hasMany con readings se implementará más tarde
  // para evitar referencias circulares

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static async assignUuid(sensor: Sensor) {
    sensor.id = randomUUID()
  }
}
