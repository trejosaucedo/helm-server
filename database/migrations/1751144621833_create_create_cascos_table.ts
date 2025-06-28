import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cascos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table.string('physical_id').notNullable().unique()
      table.string('supervisor_id').notNullable()
      table.string('minero_id').nullable()
      table.boolean('is_active').defaultTo(false)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Foreign keys
      table.foreign('supervisor_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('minero_id').references('id').inTable('users').onDelete('SET NULL')
    })

    // Agregar foreign key de users.casco_id -> cascos.id
    this.schema.alterTable('users', (table) => {
      table.foreign('casco_id').references('id').inTable('cascos').onDelete('SET NULL')
    })
  }

  async down() {
    // Primero eliminar la foreign key de users
    this.schema.alterTable('users', (table) => {
      table.dropForeign(['casco_id'])
    })

    // Luego eliminar la tabla cascos
    this.schema.dropTable(this.tableName)
  }
}
