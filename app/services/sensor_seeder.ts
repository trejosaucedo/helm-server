import { SensorRepository } from '#repositories/sensor_repository'
import { CascoRepository } from '#repositories/casco_repository'
import type { CreateSensorDto } from '#dtos/sensor.dto'

export class SensorSeeder {
  private sensorRepository: SensorRepository
  private cascoRepository: CascoRepository

  constructor() {
    this.sensorRepository = new SensorRepository()
    this.cascoRepository = new CascoRepository()
  }

  /**
   * Crea los 4 sensores estándar para un casco
   */
  async createDefaultSensorsForCasco(cascoId: string): Promise<any[]> {
    const defaultSensors: CreateSensorDto[] = [
      {
        cascoId,
        type: 'heart_rate',
        name: 'Sensor de Frecuencia Cardíaca',
        minValue: 60,
        maxValue: 100,
        unit: 'bpm',
        sampleRate: 30, // cada 30 segundos
        alertThreshold: 120, // alerta crítica si supera 120 bpm
      },
      {
        cascoId,
        type: 'body_temperature',
        name: 'Sensor de Temperatura Corporal',
        minValue: 36.0,
        maxValue: 37.5,
        unit: '°C',
        sampleRate: 60, // cada minuto
        alertThreshold: 38.5, // alerta crítica si supera 38.5°C
      },
      {
        cascoId,
        type: 'gas',
        name: 'Sensor de Gas',
        minValue: 0,
        maxValue: 50,
        unit: 'ppm',
        sampleRate: 15, // cada 15 segundos
        alertThreshold: 100, // alerta crítica si supera 100 ppm
      },
      {
        cascoId,
        type: 'gps',
        name: 'Sensor GPS',
        unit: 'coord',
        sampleRate: 300, // cada 5 minutos
        // GPS no tiene rangos normales, solo para tracking
      },
    ]

    const createdSensors = []
    
    for (const sensorData of defaultSensors) {
      try {
        const sensor = await this.sensorRepository.create(sensorData)
        createdSensors.push(sensor)
        console.log(`✅ Sensor ${sensorData.name} creado para casco ${cascoId}`)
      } catch (error) {
        console.error(`❌ Error creando sensor ${sensorData.name}:`, error)
      }
    }
    
    return createdSensors
  }

  /**
   * Crea sensores para todos los cascos existentes que no tengan sensores
   */
  async seedSensorsForAllCascos(): Promise<void> {
    try {
      console.log('🔄 Iniciando seeding de sensores...')
      
      // Obtener todos los cascos activos
      const cascos = await this.cascoRepository.findAll()
      
      if (cascos.length === 0) {
        console.log('⚠️  No se encontraron cascos en la base de datos')
        return
      }

      console.log(`� Encontrados ${cascos.length} cascos`)
      
      for (const casco of cascos) {
        // Verificar si ya tiene sensores
        const existingSensors = await this.sensorRepository.findByCascoId(casco.id)
        
        if (existingSensors.length === 0) {
          console.log(`🔧 Creando sensores para casco ${casco.id}`)
          await this.createDefaultSensorsForCasco(casco.id)
        } else {
          console.log(`✅ Casco ${casco.id} ya tiene ${existingSensors.length} sensores`)
        }
      }
      
      console.log('✅ Seeding de sensores completado')
      
    } catch (error) {
      console.error('❌ Error en seeding:', error)
    }
  }
}
