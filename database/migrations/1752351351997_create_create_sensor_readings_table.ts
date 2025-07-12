import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sensor_readings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('sensor_id').references('id').inTable('sensors').onDelete('CASCADE')
      table.uuid('casco_id').references('id').inTable('cascos').onDelete('CASCADE')
      table.uuid('minero_id').references('id').inTable('users').onDelete('CASCADE')
      table.decimal('value', 10, 4).notNullable()
      table.string('unit').notNullable()
      table.boolean('is_normal').notNullable().defaultTo(true)
      table.boolean('is_alert').notNullable().defaultTo(false)
      table.integer('battery_level').nullable()
      table.integer('signal_strength').nullable()
      table.text('location').nullable() // JSON string para GPS
      table.text('metadata').nullable() // JSON string para datos adicionales
      table.timestamp('timestamp', { useTz: true }).notNullable() // Momento de la lectura
      table.timestamp('received_at', { useTz: true }).notNullable().defaultTo(this.now()) // Momento de recepción
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()

      // Índices para optimizar consultas
      table.index(['sensor_id', 'timestamp'])
      table.index(['minero_id', 'timestamp'])
      table.index(['casco_id', 'timestamp'])
      table.index(['is_alert', 'timestamp'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}