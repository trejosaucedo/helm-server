import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

const redisConfig = defineConfig({
  connection: 'main',
  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      username: env.get('REDIS_USERNAME', 'default'),
      password: env.get('REDIS_PASSWORD'),
      tls: {},
      connectTimeout: 10000,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    },
  },
})

export default redisConfig
