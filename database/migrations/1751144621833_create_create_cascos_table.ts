import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cascos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('serial').unique().notNullable()
      table.boolean('asignado_supervisor').notNullable().defaultTo(false)
      table.boolean('asignado_minero').notNullable().defaultTo(false)
      table.uuid('supervisor_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.uuid('minero_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('fecha_activacion', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
