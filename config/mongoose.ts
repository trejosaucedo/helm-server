import env from '#start/env'

export const mongooseConfig = {
  url: env.get('MONGODB_URL'),
}
