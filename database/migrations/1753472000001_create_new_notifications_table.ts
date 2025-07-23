import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    // Eliminar tabla si existe
    this.schema.dropTableIfExists(this.tableName)
    
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.enum('type', ['sensor_alert', 'system', 'supervisor_message']).notNullable()
      table.string('title').notNullable()
      table.text('message').notNullable()
      table.string('priority').defaultTo('normal')
      table.boolean('is_read').defaultTo(false)
      table.json('data').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()

      // Índices para optimizar consultas
      table.index(['user_id', 'is_read'])
      table.index(['user_id', 'type'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
