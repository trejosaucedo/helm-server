import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('type').notNullable()
      table.text('mensaje').notNullable()
      table.text('data').nullable() // JSON serializado con info adicional
      table.string('canal').notNullable() // 'app', 'correo', etc.
      table.boolean('read').notNullable().defaultTo(false)
      table.timestamp('fecha_envio', { useTz: true }).notNullable()
      table.timestamp('fecha_leido', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
