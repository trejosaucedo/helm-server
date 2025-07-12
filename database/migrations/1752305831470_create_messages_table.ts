import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.uuid('from_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.uuid('to_user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.uuid('equipo_id').nullable().references('id').inTable('teams').onDelete('SET NULL')
      table.text('mensaje').notNullable()
      table.text('read_by').nullable() // JSON de IDs que han leído (para grupal)
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
