import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'access_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.string('codigo').unique().notNullable()
      table.string('correo_supervisor').notNullable()
      table.boolean('usado').notNullable().defaultTo(false)
      table.timestamp('fecha_generacion', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('fecha_uso', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
