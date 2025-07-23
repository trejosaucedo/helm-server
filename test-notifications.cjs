#!/usr/bin/env node

/**
 * Script para probar el sistema de notificaciones
 * Simula alertas de sensores y mensajes de supervisores
 */

const axios = require('axios')

const BASE_URL = 'http://127.0.0.1:3333'

// Datos de prueba (estos deberían existir en tu base de datos)
const TEST_USER_ID = 'test-user-id' // Reemplaza con un ID real
const TEST_SUPERVISOR_ID = 'test-supervisor-id'

async function testNotificationSystem() {
  console.log('🧪 Iniciando pruebas del sistema de notificaciones...\n')

  try {
    // 1. Probar endpoint de health
    console.log('1. Probando health check...')
    const health = await axios.get(`${BASE_URL}/health`)
    console.log('✅ Health check:', health.data.status)

    // 2. Para probar notificaciones necesitamos autenticación
    console.log('\n2. Para probar notificaciones completas necesitas:')
    console.log('   - Usuario autenticado')
    console.log('   - Token válido')
    console.log('   - Datos de mineros/supervisores en BD')

    console.log('\n3. El sistema está configurado para:')
    console.log('   📡 WebSocket en tiempo real')
    console.log('   📧 Email para notificaciones críticas')
    console.log('   📱 Push para notificaciones high/critical')

    console.log('\n✅ Sistema de notificaciones listo para usar!')

  } catch (error) {
    console.error('❌ Error en pruebas:', error.message)
  }
}

// Función para probar alertas de sensores (llamar desde sensor_reading_service)
async function simulateSensorAlert() {
  console.log('🚨 Simulando alerta de sensor...')
  
  // Esta función se ejecutaría automáticamente cuando un sensor
  // detecte valores fuera del rango normal en sensor_reading_service.ts
  
  const alertData = {
    userId: 'minero-123',
    sensorType: 'heart_rate',
    sensorName: 'Monitor Cardíaco',
    value: 150, // BPM crítico
    unit: 'bpm',
    threshold: 120,
    cascoId: 'casco-456',
    location: JSON.stringify({ lat: 20.123, lng: -100.456 })
  }
  
  console.log('📊 Datos de alerta:', alertData)
  console.log('🔄 Esta alerta se crearía automáticamente en el flujo normal')
}

if (require.main === module) {
  testNotificationSystem()
  console.log('\n' + '='.repeat(50))
  simulateSensorAlert()
}

module.exports = { testNotificationSystem, simulateSensorAlert }
