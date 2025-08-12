import vine from '@vinejs/vine'

/**
 * Validator para crear sensores
 */
export const createSensorValidator = vine.compile(
  vine.object({
    cascoId: vine.string().uuid(),
    type: vine.enum(['gps', 'heart_rate', 'body_temperature', 'gas']),
    name: vine.string().minLength(1).maxLength(100),
    minValue: vine.number().optional(),
    maxValue: vine.number().optional(),
    unit: vine.string().minLength(1).maxLength(20),
    sampleRate: vine.number().withoutDecimals().min(1).max(3600).optional(),
    alertThreshold: vine.number().optional(),
  })
)

/**
 * Validator para actualizar sensores
 */
export const updateSensorValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(100).optional(),
    minValue: vine.number().optional(),
    maxValue: vine.number().optional(),
    unit: vine.string().minLength(1).maxLength(20).optional(),
    sampleRate: vine.number().withoutDecimals().min(1).max(3600).optional(),
    alertThreshold: vine.number().optional(),
    isActive: vine.boolean().optional(),
  })
)

/**
 * Validator para crear lecturas de sensores
 */
export const createSensorReadingValidator = vine.compile(
  vine.object({
    id: vine.string().optional(), // ID local del dispositivo
    sensorId: vine.string().uuid(),
    sensorLocalId: vine.string().optional(), // ID local del sensor en el dispositivo
    identificador: vine.string().optional(), // Identificador del sensor (TMP, MQ7, MAX, GPS)
    cascoId: vine.string().uuid(),
    mineroId: vine.string().uuid(),
    value: vine.number(),
    unit: vine.string().minLength(1).maxLength(20),
    batteryLevel: vine.number().withoutDecimals().min(0).max(100).optional(),
    signalStrength: vine.number().withoutDecimals().min(0).max(100).optional(),
    location: vine.string().optional(), // JSON string para GPS
    metadata: vine.any().optional(),
    timestamp: vine.string().optional(), // ISO string
  })
)

/**
 * Validator para filtros de lecturas
 */
export const sensorReadingFiltersValidator = vine.compile(
  vine.object({
    cascoId: vine.string().uuid().optional(),
    mineroId: vine.string().uuid().optional(),
    sensorType: vine.enum(['gps', 'heart_rate', 'body_temperature', 'gas']).optional(),
    identificador: vine.string().optional(), // Filtro por identificador (TMP, MQ7, MAX, GPS)
    startDate: vine.string().optional(),
    endDate: vine.string().optional(),
    isAlert: vine.boolean().optional(),
    limit: vine.number().withoutDecimals().min(1).max(1000).optional(),
    offset: vine.number().withoutDecimals().min(0).optional(),
  })
)

/**
 * Validator para parámetros de ID
 */
export const sensorIdValidator = vine.compile(
  vine.object({
    id: vine.string().uuid(),
  })
)

/**
 * Validator para ingestión de datos en batch
 */
export const batchSensorDataValidator = vine.compile(
  vine.object({
    readings: vine
      .array(
        vine.object({
          sensorId: vine.string().uuid(),
          cascoId: vine.string().uuid(),
          mineroId: vine.string().uuid(),
          value: vine.number(),
          unit: vine.string().minLength(1).maxLength(20),
          batteryLevel: vine.number().withoutDecimals().min(0).max(100).optional(),
          signalStrength: vine.number().withoutDecimals().min(0).max(100).optional(),
          location: vine.string().optional(),
          metadata: vine.any().optional(),
          timestamp: vine.string().optional(),
        })
      )
      .minLength(1)
      .maxLength(100),
  })
)
