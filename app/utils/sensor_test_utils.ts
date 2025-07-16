/**
 * Utilidades para probar el sistema de sensores
 * Este archivo contiene funciones helper para testing manual
 */

import { SensorService } from '#services/sensor_service'
import type { CreateSensorDto, CreateSensorReadingDto } from '#dtos/sensor.dto'

export class SensorTestUtils {
  private sensorService: SensorService

  constructor() {
    this.sensorService = new SensorService()
  }

  /**
   * Crea datos de prueba para sensores
   */
  static generateTestSensorData(cascoId: string): CreateSensorDto[] {
    return [
      {
        cascoId,
        type: 'heart_rate',
        name: 'Sensor de Frecuencia Cardíaca',
        minValue: 60,
        maxValue: 100,
        unit: 'bpm',
        sampleRate: 30,
        alertThreshold: 120,
      },
      {
        cascoId,
        type: 'body_temperature',
        name: 'Sensor de Temperatura Corporal',
        minValue: 36.0,
        maxValue: 37.5,
        unit: '°C',
        sampleRate: 60,
        alertThreshold: 38.5,
      },
      {
        cascoId,
        type: 'gas',
        name: 'Sensor de Gas',
        minValue: 0,
        maxValue: 50,
        unit: 'ppm',
        sampleRate: 15,
        alertThreshold: 100,
      },
      {
        cascoId,
        type: 'gps',
        name: 'Sensor GPS',
        unit: 'coord',
        sampleRate: 300,
      },
    ]
  }

  /**
   * Genera lecturas de prueba para testing
   */
  static generateTestReadings(
    sensorId: string,
    cascoId: string,
    mineroId: string
  ): CreateSensorReadingDto[] {
    return [
      {
        sensorId,
        cascoId,
        mineroId,
        value: 75,
        unit: 'bpm',
        batteryLevel: 95,
        signalStrength: 88,
        timestamp: new Date().toISOString(),
      },
      {
        sensorId,
        cascoId,
        mineroId,
        value: 125, // Valor que debería generar alerta
        unit: 'bpm',
        batteryLevel: 95,
        signalStrength: 88,
        timestamp: new Date(Date.now() + 60000).toISOString(), // 1 minuto después
      },
    ]
  }

  /**
   * Simula datos de GPS
   */
  static generateGPSReading(
    sensorId: string,
    cascoId: string,
    mineroId: string
  ): CreateSensorReadingDto {
    return {
      sensorId,
      cascoId,
      mineroId,
      value: 0, // GPS no tiene valor numérico
      unit: 'coord',
      location: JSON.stringify({
        latitude: -12.046374 + (Math.random() - 0.5) * 0.01, // Lima, Perú con variación
        longitude: -77.042793 + (Math.random() - 0.5) * 0.01,
        altitude: 154,
        accuracy: 5,
      }),
      batteryLevel: 92,
      signalStrength: 85,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Simula datos de gas peligroso
   */
  static generateDangerousGasReading(
    sensorId: string,
    cascoId: string,
    mineroId: string
  ): CreateSensorReadingDto {
    return {
      sensorId,
      cascoId,
      mineroId,
      value: 150, // Valor peligroso que debería generar alerta crítica
      unit: 'ppm',
      batteryLevel: 89,
      signalStrength: 78,
      metadata: {
        gasType: 'CO',
        riskLevel: 'HIGH',
        location: 'Túnel Sector 7',
      },
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Crea un conjunto completo de sensores para testing
   */
  async createTestSensors(cascoId: string): Promise<any[]> {
    const testData = SensorTestUtils.generateTestSensorData(cascoId)
    const createdSensors = []

    for (const sensorData of testData) {
      try {
        const sensor = await this.sensorService.createSensor(sensorData)
        createdSensors.push(sensor)
        console.log(`✅ Sensor creado: ${sensor.name} (ID: ${sensor.id})`)
      } catch (error) {
        console.error(`❌ Error creando sensor ${sensorData.name}:`, error)
      }
    }

    return createdSensors
  }

  /**
   * Ingesta lecturas de prueba
   */
  async ingestTestReadings(sensorId: string, cascoId: string, mineroId: string): Promise<void> {
    const testReadings = SensorTestUtils.generateTestReadings(sensorId, cascoId, mineroId)

    for (const reading of testReadings) {
      try {
        const result = await this.sensorService.ingestReading(reading)
        console.log(
          `✅ Lectura ingresada: ${result.value} ${result.unit} (Alerta: ${result.isAlert})`
        )
      } catch (error) {
        console.error(`❌ Error ingresando lectura:`, error)
      }
    }
  }
}

/**
 * Ejemplos de uso para testing manual
 */
export const sensorTestExamples = {
  // Ejemplo de cómo crear sensores para un casco
  createSensorsExample: async (cascoId: string) => {
    const utils = new SensorTestUtils()
    return await utils.createTestSensors(cascoId)
  },

  // Ejemplo de cómo ingestar lecturas
  ingestReadingsExample: async (sensorId: string, cascoId: string, mineroId: string) => {
    const utils = new SensorTestUtils()
    await utils.ingestTestReadings(sensorId, cascoId, mineroId)
  },

  // Ejemplo de lectura de GPS
  gpsReadingExample: (sensorId: string, cascoId: string, mineroId: string) => {
    return SensorTestUtils.generateGPSReading(sensorId, cascoId, mineroId)
  },

  // Ejemplo de lectura de gas peligroso
  dangerousGasExample: (sensorId: string, cascoId: string, mineroId: string) => {
    return SensorTestUtils.generateDangerousGasReading(sensorId, cascoId, mineroId)
  },
}
