import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary() // UUID como clave primaria
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.enum('role', ['supervisor', 'minero', 'admin']).defaultTo('supervisor')
      table.uuid('supervisor_id').nullable()
      table.uuid('casco_id').nullable().unique()
      table.string('birth_date').nullable()
      table.string('phone').nullable()
      table.string('rfc').nullable()
      table.string('address').nullable()
      table.string('especialidad_en_mineria').nullable()
      table.string('genero').nullable()
      table.string('fecha_contratacion').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
