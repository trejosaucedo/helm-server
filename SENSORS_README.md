# Sistema de Sensores - Cascos Mineros

## 📋 Resumen

Sistema completo de sensores para cascos de minería que incluye:
- **4 tipos de sensores por casco**: GPS, Frecuencia Cardíaca, Temperatura Corporal, Gas
- **Ingestión de datos en tiempo real**
- **Sistema de alertas automáticas**
- **Almacenamiento optimizado** (Redis + MySQL)
- **Notificaciones push/email**

## 🏗️ Arquitectura

### Modelos
- **Sensor**: Configuración de sensores por casco
- **SensorReading**: Lecturas individuales de sensores

### Componentes
- **SensorController**: Endpoints REST para gestión
- **SensorService**: Lógica de negocio y alertas
- **SensorRepository**: Acceso a datos
- **SensorReadingRepository**: Gestión de lecturas

## 🚀 Endpoints API

### Gestión de Sensores
```
POST   /sensors                    # Crear sensor (supervisor)
PUT    /sensors/:id               # Actualizar sensor (supervisor)
GET    /sensors/casco/:cascoId    # Obtener sensores por casco
GET    /sensors/minero/:mineroId  # Obtener sensores por minero
GET    /sensors/:id/stats         # Estadísticas de sensor
```

### Ingestión de Datos
```
POST   /sensors/readings          # Ingestar lectura individual
POST   /sensors/readings/batch    # Ingestar múltiples lecturas
```

### Consultas
```
GET    /sensors/readings          # Consultar lecturas con filtros
GET    /sensors/readings/recent/:mineroId  # Lecturas recientes
```

## 📊 Tipos de Sensores

### 1. Frecuencia Cardíaca
- **Unidad**: bpm
- **Rango Normal**: 60-100 bpm
- **Alerta Crítica**: >120 bpm o <30 bpm
- **Frecuencia**: Cada 30 segundos

### 2. Temperatura Corporal
- **Unidad**: °C
- **Rango Normal**: 36.0-37.5°C
- **Alerta Crítica**: >38.5°C o <35°C
- **Frecuencia**: Cada minuto

### 3. Gas
- **Unidad**: ppm
- **Rango Normal**: 0-50 ppm
- **Alerta Crítica**: >100 ppm
- **Frecuencia**: Cada 15 segundos

### 4. GPS
- **Unidad**: coordenadas
- **Datos**: latitud, longitud, altitud
- **Frecuencia**: Cada 5 minutos

## 🔧 Configuración

### Crear Sensores por Defecto
```javascript
import { SensorTestUtils } from '#utils/sensor_test_utils'

// Crear sensores para un casco
const utils = new SensorTestUtils()
await utils.createTestSensors('casco-uuid-here')
```

### Ingestar Datos de Prueba
```javascript
// Lectura normal
POST /sensors/readings
{
  "sensorId": "sensor-uuid",
  "cascoId": "casco-uuid",
  "mineroId": "minero-uuid",
  "value": 75,
  "unit": "bpm",
  "batteryLevel": 95,
  "signalStrength": 88
}

// Lectura con alerta
POST /sensors/readings
{
  "sensorId": "sensor-uuid",
  "cascoId": "casco-uuid", 
  "mineroId": "minero-uuid",
  "value": 125,
  "unit": "bpm"
}
```

## 🚨 Sistema de Alertas

### Condiciones de Alerta
- **Frecuencia Cardíaca**: Fuera de rango 60-100 bpm
- **Temperatura**: Fuera de rango 36-37.5°C
- **Gas**: Nivel peligroso >100 ppm
- **GPS**: Sin alertas (solo tracking)

### Notificaciones Automáticas
- **Base de datos**: Todas las alertas
- **Push móvil**: Alertas críticas
- **Email**: Alertas críticas

## 📈 Estadísticas y Monitoreo

### Métricas Disponibles
- Promedio de valores
- Valores mín/máx
- Cantidad de lecturas
- Número de alertas
- Tendencia (subida/bajada/estable)

### Ejemplo de Consulta
```javascript
GET /sensors/sensor-uuid/stats?hours=24
```

## 🧪 Testing

### Datos de Prueba
```javascript
import { sensorTestExamples } from '#utils/sensor_test_utils'

// Crear sensores de prueba
await sensorTestExamples.createSensorsExample('casco-uuid')

// Ingestar lecturas de prueba
await sensorTestExamples.ingestReadingsExample('sensor-uuid', 'casco-uuid', 'minero-uuid')

// Simular alerta de gas
const dangerousReading = sensorTestExamples.dangerousGasExample('sensor-uuid', 'casco-uuid', 'minero-uuid')
```

## 🔄 Próximos Pasos

1. **Configurar Base de Datos**: Ejecutar migraciones
2. **Implementar WebSockets**: Para tiempo real
3. **Integrar Redis**: Para lecturas recientes
4. **Crear Dashboard**: Visualización de datos
5. **Configurar Alertas**: Umbrales personalizables

## 📝 Notas Importantes

- Los sensores se crean automáticamente al activar un casco
- Las lecturas se evalúan en tiempo real
- Las alertas se envían inmediatamente
- Los datos históricos se almacenan para análisis
- La API está protegida con autenticación JWT

## 🔗 Integración con Otros Sistemas

- **Notificaciones**: Integrado con sistema de notificaciones
- **Usuarios**: Vinculado a mineros y supervisores
- **Cascos**: Cada casco tiene exactamente 4 sensores
- **Equipos**: Las alertas se pueden enviar a equipos completos
