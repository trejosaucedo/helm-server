import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('type').notNullable()
      table.string('title').notNullable()
      table.text('message').notNullable()
      table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium')
      table.text('data').nullable() // JSON serializado con info adicional
      table.text('delivery_channels').notNullable() // JSON array: ['database', 'email', 'push']
      table.boolean('read').notNullable().defaultTo(false)
      table.boolean('is_read').notNullable().defaultTo(false) // Alias para read
      table.boolean('is_error').notNullable().defaultTo(false)
      table.boolean('email_sent').notNullable().defaultTo(false)
      table.boolean('push_sent').notNullable().defaultTo(false)
      table.timestamp('fecha_envio', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('fecha_leido', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
