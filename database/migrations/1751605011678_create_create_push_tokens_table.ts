import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreatePushTokensTable extends BaseSchema {
  protected tableName = 'push_tokens'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable()
      table.string('token', 512).notNullable()
      table.enum('platform', ['ios','web'] as const).notNullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('last_used', { useTz: true }).nullable()
      table.timestamps(true, true)      // Timestamps automáticas

      // Foreign key y índices
      table
        .foreign('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.unique(['user_id', 'token'])
      table.index(['user_id', 'is_active'])
      table.index(['token'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}



