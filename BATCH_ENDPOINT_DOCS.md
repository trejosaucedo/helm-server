# Endpoint Batch para Sensores

## Descripción
Endpoint para enviar múltiples lecturas de sensores en una sola petición HTTP.

## Endpoint
```
POST /cascos/:cascoId/sensores/batch
```

## Headers
```
Content-Type: application/json
x-device-token: tu-device-token
```

## Estructura del Body
El body debe ser un arreglo de objetos, donde cada objeto representa una lectura de sensor:

```json
[
  {
    "sensorId": "uuid-del-sensor-1",
    "identificador": "TMP",
    "mineroId": "uuid-del-minero",
    "value": 36.8,
    "unit": "C",
    "timestamp": "2025-08-12T21:58:22.436040+00:00",
    "metadata": {
      "tempC": 36.8,
      "deviceTsMs": 1755034567890
    }
  },
  {
    "sensorId": "uuid-del-sensor-2", 
    "identificador": "MQ7",
    "mineroId": "uuid-del-minero",
    "value": 45,
    "unit": "ppm",
    "timestamp": "2025-08-12T21:58:22.502798+00:00",
    "metadata": {
      "mq7": 45,
      "mv": 2863,
      "deviceTsMs": 1755034567890
    }
  },
  {
    "sensorId": "uuid-del-sensor-3",
    "identificador": "MAX", 
    "mineroId": "uuid-del-minero",
    "value": 75,
    "unit": "bpm",
    "timestamp": "2025-08-12T21:58:22.515587+00:00",
    "metadata": {
      "bpm": 75,
      "red": 1435,
      "ir": 1044,
      "contact": true,
      "deviceTsMs": 1755034567890
    }
  },
  {
    "sensorId": "uuid-del-sensor-4",
    "identificador": "GPS",
    "mineroId": "uuid-del-minero", 
    "value": 1,
    "unit": "coords",
    "timestamp": "2025-08-12T21:58:22.527432+00:00",
    "location": {
      "latitude": 25.531466,
      "longitude": -103.322077,
      "accuracy": 5.0
    },
    "metadata": {
      "gpsFix": true,
      "sats": 8,
      "lat": 25.531466,
      "lng": -103.322077,
      "deviceTsMs": 1755034567890
    }
  }
]
```

## Respuesta Exitosa
```json
{
  "success": true,
  "message": "Batch procesado: 4 exitosas, 0 errores",
  "data": {
    "processed": 4,
    "errors": 0,
    "results": [
      {
        "index": 0,
        "sensorId": "uuid-del-sensor-1",
        "status": "success"
      },
      {
        "index": 1, 
        "sensorId": "uuid-del-sensor-2",
        "status": "success"
      },
      {
        "index": 2,
        "sensorId": "uuid-del-sensor-3", 
        "status": "success"
      },
      {
        "index": 3,
        "sensorId": "uuid-del-sensor-4",
        "status": "success"
      }
    ],
    "errorDetails": []
  }
}
```

## Respuesta con Errores Parciales
```json
{
  "success": true,
  "message": "Batch procesado: 2 exitosas, 2 errores",
  "data": {
    "processed": 2,
    "errors": 2,
    "results": [
      {
        "index": 0,
        "sensorId": "uuid-del-sensor-1",
        "status": "success"
      },
      {
        "index": 2,
        "sensorId": "uuid-del-sensor-3",
        "status": "success"
      }
    ],
    "errorDetails": [
      {
        "index": 1,
        "sensorId": "uuid-sensor-invalido",
        "error": "Sensor uuid-sensor-invalido no pertenece al casco"
      },
      {
        "index": 3,
        "sensorId": "uuid-sensor-inexistente", 
        "error": "Sensor uuid-sensor-inexistente no encontrado"
      }
    ]
  }
}
```

## Campos Requeridos por Lectura
- `sensorId`: UUID del sensor (debe pertenecer al casco especificado)
- `mineroId`: UUID del minero
- `value`: Valor numérico de la lectura
- `unit`: Unidad de medida

## Campos Opcionales por Lectura
- `identificador`: Identificador del sensor (TMP, MQ7, MAX, GPS)
- `timestamp`: Timestamp ISO 8601 (si no se envía, se usa el momento actual)
- `location`: Objeto con coordenadas GPS (solo para sensores GPS)
- `metadata`: Objeto con metadatos adicionales

## Ventajas del Endpoint Batch
1. **Eficiencia**: Envía múltiples lecturas en una sola petición HTTP
2. **Reducción de latencia**: Menos overhead de red
3. **Tolerancia a errores**: Si una lectura falla, las demás se procesan
4. **Atomicidad por lectura**: Cada lectura se procesa independientemente

## Ejemplo de uso en JavaScript
```javascript
const batchData = [
  {
    sensorId: "sensor-temp-id",
    identificador: "TMP",
    mineroId: "minero-id",
    value: 36.8,
    unit: "C",
    timestamp: new Date().toISOString()
  },
  {
    sensorId: "sensor-gas-id", 
    identificador: "MQ7",
    mineroId: "minero-id",
    value: 45,
    unit: "ppm",
    timestamp: new Date().toISOString()
  }
];

const response = await fetch(`/cascos/${cascoId}/sensores/batch`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-device-token': 'your-device-token'
  },
  body: JSON.stringify(batchData)
});

const result = await response.json();
console.log(`Procesadas: ${result.data.processed}, Errores: ${result.data.errors}`);
```

## Notas Importantes
- Máximo recomendado: 100 lecturas por batch
- El servidor procesa las lecturas secuencialmente
- Si una lectura falla, no afecta a las demás
- Todos los sensores deben pertenecer al mismo casco especificado en la URL
