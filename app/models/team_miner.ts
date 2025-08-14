import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import User from './user.js'
import Team from './team.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { cuid } from '@adonisjs/core/helpers'

export default class TeamMiner extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare mineroId: string

  @column()
  declare equipoId: string

  @column()
  declare activo: boolean

  @column.dateTime()
  declare fechaAsignacion: DateTime

  @column.dateTime()
  declare fechaSalida: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'mineroId',
  })
  declare minero: BelongsTo<typeof User>

  @belongsTo(() => Team, {
    foreignKey: 'equipoId',
  })
  declare equipo: BelongsTo<typeof Team>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  public static ensureId(row: TeamMiner) {
    // Si el motor no autogenera PK (caso raro), asegura un id
    if (!(row as any).id) {
      // Para tablas con increments, no seteamos id manualmente
      // Este hook actúa solo si el esquema cambiara a string en algún entorno
      // y llega vacío, en cuyo caso asignamos cuid
      try {
        // si el tipo es number, no tocar
        if (typeof (row as any).id === 'number') return
        ;(row as any).id = cuid()
      } catch {}
    }
  }
}
