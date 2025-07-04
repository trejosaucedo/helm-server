import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateNotificationsTable extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('user_id').notNullable()
      table.enum('type', ['general', 'sensor', 'supervisor']).defaultTo('general')
      table.string('title').notNullable()
      table.text('message').notNullable()
      table.json('data').nullable()
      table.boolean('is_read').defaultTo(false)
      table.boolean('is_error').defaultTo(false)
      table.text('error_comment').nullable()
      table.enum('priority', ['low', 'medium', 'high', 'critical']).defaultTo('medium')
      table.json('delivery_channels').defaultTo(JSON.stringify(['database']))
      table.boolean('email_sent').defaultTo(false)
      table.boolean('push_sent').defaultTo(false)
      table.timestamp('read_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.index(['user_id', 'is_read'])
      table.index(['user_id', 'type'])
      table.index(['priority', 'email_sent'])
      table.index(['priority', 'push_sent'])
    })
  }

  async down() {
    const hasTable = await this.schema.hasTable(this.tableName)
    if (hasTable) {
      this.schema.dropTable(this.tableName)
    }
  }
}