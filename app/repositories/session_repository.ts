import redis from '@adonisjs/redis/services/main'

export class SessionRepository {
  static async saveSession(sessionId: string, data: any, ttl: number) {
    await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(data))
  }

  static async getSession(sessionId: string) {
    const raw = await redis.get(`session:${sessionId}`)
    return raw ? JSON.parse(raw) : null
  }

  static async deleteSession(sessionId: string) {
    await redis.del(`session:${sessionId}`)
  }

  static async sessionExists(sessionId: string): Promise<boolean> {
    return (await redis.exists(`session:${sessionId}`)) === 1
  }

  static async addUserSession(userId: string, sessionId: string, ttl: number) {
    const key = `user:${userId}:sessions`
    await redis.sadd(key, sessionId)
    await redis.expire(key, ttl)
  }

  static async getUserSessions(userId: string): Promise<string[]> {
    return await redis.smembers(`user:${userId}:sessions`)
  }

  static async removeUserSession(userId: string, sessionId: string) {
    await redis.srem(`user:${userId}:sessions`, sessionId)
  }

  static async clearUserSessions(userId: string) {
    await redis.del(`user:${userId}:sessions`)
  }

  static async getSessionCount(userId: string): Promise<number> {
    return await redis.scard(`user:${userId}:sessions`)
  }

  static async updateSessionLastUsed(sessionId: string) {
    const session = await this.getSession(sessionId)
    if (session) {
      session.lastUsed = new Date().toISOString()
      const ttl = await redis.ttl(`session:${sessionId}`)
      if (ttl > 0) {
        await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(session))
      }
    }
  }

  static async removeOldestSessions(userId: string, keep: number) {
    const sessionIds = await this.getUserSessions(userId)
    const sessions = await Promise.all(
      sessionIds.map(async (sid) => {
        const data = await this.getSession(sid)
        return data ? { id: sid, createdAt: data.createdAt } : null
      })
    )
    const sorted = sessions
      .filter(Boolean)
      .sort((a, b) => new Date(a!.createdAt).getTime() - new Date(b!.createdAt).getTime())
    const toRemove = sorted.slice(0, sorted.length - keep)
    for (const sess of toRemove) {
      if (sess) {
        await this.deleteSession(sess.id)
        await this.removeUserSession(userId, sess.id)
      }
    }
  }
}
