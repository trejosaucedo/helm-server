import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    const hasPhone = await this.schema.hasColumn(this.tableName, 'phone')
    const hasRfc = await this.schema.hasColumn(this.tableName, 'rfc')
    const hasAddress = await this.schema.hasColumn(this.tableName, 'address')
    const hasBirthDate = await this.schema.hasColumn(this.tableName, 'birth_date')

    if (!hasPhone || !hasRfc || !hasAddress || !hasBirthDate) {
      this.schema.alterTable(this.tableName, (table) => {
        if (!hasPhone) table.string('phone').nullable()
        if (!hasRfc) table.string('rfc').nullable()
        if (!hasAddress) table.string('address').nullable()
        if (!hasBirthDate) table.string('birth_date').nullable()
      })
    }
  }

  async down() {
    const hasPhone = await this.schema.hasColumn(this.tableName, 'phone')
    const hasRfc = await this.schema.hasColumn(this.tableName, 'rfc')
    const hasAddress = await this.schema.hasColumn(this.tableName, 'address')
    const hasBirthDate = await this.schema.hasColumn(this.tableName, 'birth_date')

    if (hasPhone || hasRfc || hasAddress || hasBirthDate) {
      this.schema.alterTable(this.tableName, (table) => {
        if (hasPhone) table.dropColumn('phone')
        if (hasRfc) table.dropColumn('rfc')
        if (hasAddress) table.dropColumn('address')
        if (hasBirthDate) table.dropColumn('birth_date')
      })
    }
  }
}


