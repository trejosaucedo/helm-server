import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sensors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('casco_id').references('id').inTable('cascos').onDelete('CASCADE')
      table.enum('type', ['gps', 'heart_rate', 'body_temperature', 'gas']).notNullable()
      table.string('name').notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.decimal('min_value', 10, 4).nullable()
      table.decimal('max_value', 10, 4).nullable()
      table.string('unit').notNullable()
      table.integer('sample_rate').notNullable().defaultTo(60) // segundos
      table.decimal('alert_threshold', 10, 4).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
