import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import CascoSeeder from '#database/seeders/casco_seeder'

export default class SeedCascos extends BaseCommand {
  static commandName = 'seed:cascos'
  static description = 'Seed database with test cascos'
  static options: CommandOptions = {}

  async run() {
    this.logger.info('Starting cascos seeder...')
    
    const seeder = new CascoSeeder()
    await seeder.run()
    
    this.logger.success('Cascos seeded successfully!')
  }
}
