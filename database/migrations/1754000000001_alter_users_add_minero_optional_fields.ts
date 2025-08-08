import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    // Agrega columnas opcionales para mineros si no existen en la tabla actual
    const hasEspecialidad = await this.schema.hasColumn(this.tableName, 'especialidad_en_mineria')
    const hasGenero = await this.schema.hasColumn(this.tableName, 'genero')
    const hasFechaContratacion = await this.schema.hasColumn(this.tableName, 'fecha_contratacion')

    if (!hasEspecialidad || !hasGenero || !hasFechaContratacion) {
      this.schema.alterTable(this.tableName, (table) => {
        if (!hasEspecialidad) table.string('especialidad_en_mineria').nullable()
        if (!hasGenero) table.string('genero').nullable()
        if (!hasFechaContratacion) table.string('fecha_contratacion').nullable()
      })
    }
  }

  public async down() {
    const hasEspecialidad = await this.schema.hasColumn(this.tableName, 'especialidad_en_mineria')
    const hasGenero = await this.schema.hasColumn(this.tableName, 'genero')
    const hasFechaContratacion = await this.schema.hasColumn(this.tableName, 'fecha_contratacion')

    if (hasEspecialidad || hasGenero || hasFechaContratacion) {
      this.schema.alterTable(this.tableName, (table) => {
        if (hasEspecialidad) table.dropColumn('especialidad_en_mineria')
        if (hasGenero) table.dropColumn('genero')
        if (hasFechaContratacion) table.dropColumn('fecha_contratacion')
      })
    }
  }
}


