import { BaseCommand } from '@adonisjs/core/ace'

export default class CreateAdmin extends BaseCommand {
  static commandName = 'create:admin'
  static description = 'Create an admin user'

  async run() {
    this.logger.info('Admin creation command placeholder')
  }
}