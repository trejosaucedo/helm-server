import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class TestLogin extends BaseCommand {
  static commandName = 'test:login'
  static description = ''

  static options: CommandOptions = {}

  async run() {
    this.logger.info('Hello world from "TestLogin"')
  }
}