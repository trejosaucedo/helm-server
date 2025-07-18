import redis from '@adonisjs/redis/services/main'

export class SensorRecentReadingsRepository {
  static async addRecentReading(sensorId: string, reading: any, windowMinutes = 5) {
    const key = `sensor:recent:${sensorId}`
    const ttl = windowMinutes * 60

    await redis.rpush(key, JSON.stringify(reading))
    await redis.expire(key, ttl)
  }

  static async getRecentReadings(sensorId: string) {
    const key = `sensor:recent:${sensorId}`
    const readings = await redis.lrange(key, 0, -1)
    return readings.map((raw: string) => JSON.parse(raw))
  }
}
