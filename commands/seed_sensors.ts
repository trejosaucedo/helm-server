import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { SensorSeeder } from '#services/sensor_seeder'

export default class SeedSensors extends BaseCommand {
  static commandName = 'seed:sensors'
  static description = 'Crear sensores por defecto para todos los cascos o para un casco específico'

  static options: CommandOptions = {
    startApp: true, // Necesario para acceder a la base de datos
  }

  @args.string({ 
    description: 'ID del casco específico (opcional)',
    required: false 
  })
  declare cascoId?: string

  @flags.boolean({ 
    description: 'Ejecutar para todos los cascos existentes',
    alias: 'a'
  })
  declare all: boolean

  @flags.boolean({ 
    description: 'Forzar creación incluso si ya existen sensores',
    alias: 'f'
  })
  declare force: boolean

  async run() {
    const seeder = new SensorSeeder()

    try {
      this.logger.info('🚀 Iniciando seeding de sensores...')

      if (this.cascoId) {
        // Seed para un casco específico
        this.logger.info(`📦 Creando sensores para casco: ${this.cascoId}`)
        await seeder.createDefaultSensorsForCasco(this.cascoId)
        this.logger.success(`✅ Sensores creados para casco ${this.cascoId}`)
      
      } else if (this.all) {
        // Seed para todos los cascos
        this.logger.info('📦 Creando sensores para todos los cascos...')
        await seeder.seedSensorsForAllCascos()
        this.logger.success('✅ Seeding completado para todos los cascos')
      
      } else {
        // Mostrar ayuda
        this.logger.info('📖 Uso del comando:')
        this.logger.info('  node ace seed:sensors <casco-id>     # Para un casco específico')
        this.logger.info('  node ace seed:sensors --all          # Para todos los cascos')
        this.logger.info('  node ace seed:sensors --force --all  # Forzar para todos')
        return
      }

    } catch (error) {
      this.logger.error('❌ Error durante el seeding:')
      this.logger.error(error.message)
      this.exitCode = 1
    }
  }
}