import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'team_miners'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('minero_id').references('id').inTable('users').onDelete('CASCADE')
      table.uuid('equipo_id').references('id').inTable('teams').onDelete('CASCADE')
      table.boolean('activo').notNullable().defaultTo(true)
      table.timestamp('fecha_asignacion', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('fecha_salida', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
