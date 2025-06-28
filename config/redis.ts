import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'

const redisConfig = defineConfig({
  connection: 'main',
  connections: {
    main: {
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      username: env.get('REDIS_USERNAME'),
      password: env.get('REDIS_PASSWORD'),
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: null,
    },
  },
})

export default redisConfig
