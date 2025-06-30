import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import redis from '@adonisjs/redis/services/main'
import { randomBytes, randomUUID } from 'node:crypto'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Casco from './casco.js'
import env from '#start/env'
import jwt from 'jsonwebtoken'
import { TokenData } from '#types/auth'

interface CookieTokenPair {
  accessToken: string
  sessionId: string
}

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

interface SessionData {
  userId: string
  refreshToken: string
  createdAt: string
  lastUsed: string
  deviceInfo?: string
  ipAddress?: string
  userAgent?: string
}

interface SessionInfo {
  sessionId: string
  createdAt: string
  lastUsed: string
  deviceInfo?: string
  ipAddress?: string
  userAgent?: string
}

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare role: 'supervisor' | 'minero'

  @column()
  declare cascoId: string | null

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Casco, {
    foreignKey: 'supervisorId',
  })
  declare cascos: HasMany<typeof Casco>

  @beforeCreate()
  static assignUuid(user: User) {
    if (!user.id) {
      user.id = randomUUID()
    }
  }

  /**
   * Generate access and refresh tokens for user authentication
   * @param deviceInfo - Device information for session tracking
   * @param ipAddress - IP address for security logging
   * @param userAgent - User agent string for device identification
   * @returns Promise with access token and session ID
   */
  async generateTokens(
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<CookieTokenPair> {
    const sessionId = randomBytes(32).toString('hex')
    const refreshToken = randomBytes(64).toString('hex')
    const now = new Date().toISOString()

    // Manage session limits BEFORE creating new session
    await this.manageSessions(sessionId)

    // Access Token (15 minutes) - JWT for cookies
    const accessTokenData: TokenData = {
      userId: this.id,
      email: this.email,
      role: this.role,
      cascoId: this.cascoId,
      createdAt: now,
      sessionId,
      type: 'access',
    }

    const accessToken = jwt.sign(accessTokenData, env.get('JWT_SECRET'), {
      expiresIn: '15m',
      issuer: 'HELM-API',
      audience: 'HELM-API-Users',
    })

    // Refresh Token (7 days) - Stored in Redis with additional metadata
    const sessionData: SessionData = {
      userId: this.id,
      refreshToken: refreshToken,
      createdAt: now,
      lastUsed: now,
      deviceInfo,
      ipAddress,
      userAgent,
    }

    const sessionKey = `session:${sessionId}`
    const sessionTtl = 7 * 24 * 60 * 60 // 7 days in seconds

    await redis.setex(sessionKey, sessionTtl, JSON.stringify(sessionData))

    return { accessToken, sessionId }
  }

  /**
   * Manage user sessions to enforce session limits
   * @param newSessionId - ID of the new session being created
   */
  private async manageSessions(newSessionId: string): Promise<void> {
    const sessionSetKey = `user:${this.id}:sessions`
    const maxSessions = 5

    try {
      const currentSessions = await redis.smembers(sessionSetKey)

      if (currentSessions.length >= maxSessions) {
        const validSessions = await this.getValidSessionsWithData(currentSessions, sessionSetKey)

        // Remove oldest sessions if we're at or over the limit
        const sessionsToRemove = validSessions.length - (maxSessions - 1)
        if (sessionsToRemove > 0) {
          await this.removeOldestSessions(validSessions, sessionsToRemove, sessionSetKey)
        }
      }

      // Add new session to the set
      await redis.sadd(sessionSetKey, newSessionId)
      await redis.expire(sessionSetKey, 7 * 24 * 60 * 60)
    } catch (error) {
      console.error('Error managing sessions:', error)
      // Continue with session creation even if management fails
    }
  }

  /**
   * Get valid sessions with their data, cleaning up invalid ones
   */
  private async getValidSessionsWithData(
    currentSessions: string[],
    sessionSetKey: string
  ): Promise<Array<{ id: string; createdAt: string }>> {
    const validSessions = []
    const pipeline = redis.pipeline()
    const sessionsToClean = []

    for (const sessionId of currentSessions) {
      const sessionData = await redis.get(`session:${sessionId}`)

      if (sessionData) {
        try {
          const data: SessionData = JSON.parse(sessionData)
          validSessions.push({
            id: sessionId,
            createdAt: data.createdAt,
          })
        } catch (error) {
          // Mark corrupted sessions for cleanup
          sessionsToClean.push(sessionId)
        }
      } else {
        // Mark non-existent sessions for cleanup
        sessionsToClean.push(sessionId)
      }
    }

    // Clean up invalid sessions
    if (sessionsToClean.length > 0) {
      for (const sessionId of sessionsToClean) {
        pipeline.srem(sessionSetKey, sessionId)
        pipeline.del(`session:${sessionId}`)
      }
      await pipeline.exec()
    }

    return validSessions
  }

  /**
   * Remove oldest sessions from Redis
   */
  private async removeOldestSessions(
    sessions: Array<{ id: string; createdAt: string }>,
    count: number,
    sessionSetKey: string
  ): Promise<void> {
    // Sort by creation date (oldest first)
    const sortedSessions = sessions.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )

    const pipeline = redis.pipeline()
    for (let i = 0; i < count && i < sortedSessions.length; i++) {
      const sessionToRemove = sortedSessions[i]
      pipeline.del(`session:${sessionToRemove.id}`)
      pipeline.srem(sessionSetKey, sessionToRemove.id)
    }

    await pipeline.exec()
  }

  /**
   * Validate Access Token from cookie
   * @param token - JWT access token
   * @returns User and token data if valid, null otherwise
   */
  static async validateAccessToken(
    token: string
  ): Promise<{ user: User; tokenData: TokenData } | null> {
    try {
      // Verify JWT with additional checks
      const decoded = jwt.verify(token, env.get('JWT_SECRET'), {
        issuer: 'HELM-API',
        audience: 'HELM-API-Users',
      }) as TokenData

      if (decoded.type !== 'access') {
        return null
      }

      // Check if session still exists
      const sessionExists = await redis.exists(`session:${decoded.sessionId}`)
      if (!sessionExists) {
        return null // Session was revoked
      }

      // Update last used timestamp
      await User.updateSessionLastUsed(decoded.sessionId)

      const user = await User.find(decoded.userId)
      if (!user) return null

      return { user, tokenData: decoded }
    } catch (error) {
      console.error('Token validation error:', error)
      return null
    }
  }

  /**
   * Update session last used timestamp
   */
  private static async updateSessionLastUsed(sessionId: string | undefined): Promise<void> {
    try {
      const sessionData = await redis.get(`session:${sessionId}`)
      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData)
        session.lastUsed = new Date().toISOString()

        // Get current TTL to preserve it
        const ttl = await redis.ttl(`session:${sessionId}`)
        if (ttl > 0) {
          await redis.setex(`session:${sessionId}`, ttl, JSON.stringify(session))
        }
      }
    } catch (error) {
      console.error('Error updating session last used:', error)
      // Don't throw error as this is not critical
    }
  }

  /**
   * Refresh Access Token using Session ID
   * @param sessionId - Session identifier
   * @returns New access token or null if invalid
   */
  static async refreshAccessToken(sessionId: string): Promise<string | null> {
    try {
      const sessionData = await redis.get(`session:${sessionId}`)
      if (!sessionData) return null

      const session: SessionData = JSON.parse(sessionData)
      const user = await User.find(session.userId)
      if (!user) return null

      // Update last used timestamp
      await User.updateSessionLastUsed(sessionId)

      // Generate new access token
      const accessTokenData: TokenData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        cascoId: user.cascoId,
        createdAt: new Date().toISOString(),
        sessionId,
        type: 'access',
      }

      return jwt.sign(accessTokenData, env.get('JWT_SECRET'), {
        expiresIn: '15m',
        issuer: 'HELM-API',
        audience: 'HELM-API-Users',
      })
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return null
    }
  }

  /**
   * Validate Session ID
   * @param sessionId - Session identifier
   * @returns User if session is valid, null otherwise
   */
  static async validateSession(sessionId: string): Promise<User | null> {
    try {
      const sessionData = await redis.get(`session:${sessionId}`)
      if (!sessionData) return null

      const session: SessionData = JSON.parse(sessionData)
      const user = await User.find(session.userId)

      if (user) {
        // Update last used timestamp
        await User.updateSessionLastUsed(sessionId)
      }

      return user || null
    } catch (error) {
      console.error('Error validating session:', error)
      return null
    }
  }

  /**
   * Revoke a specific session
   * @param sessionId - Session identifier to revoke
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      const pipeline = redis.pipeline()
      pipeline.del(`session:${sessionId}`)
      pipeline.srem(`user:${this.id}:sessions`, sessionId)
      await pipeline.exec()
    } catch (error) {
      console.error('Error revoking session:', error)
      throw new Error('Failed to revoke session')
    }
  }

  /**
   * Revoke all sessions for the user
   */
  async revokeAllSessions(): Promise<void> {
    try {
      const sessionSetKey = `user:${this.id}:sessions`
      const sessions = await redis.smembers(sessionSetKey)

      if (sessions.length > 0) {
        const pipeline = redis.pipeline()

        // Delete all session data
        sessions.forEach((sessionId) => {
          pipeline.del(`session:${sessionId}`)
        })

        // Delete the session set
        pipeline.del(sessionSetKey)

        await pipeline.exec()
      }
    } catch (error) {
      console.error('Error revoking all sessions:', error)
      throw new Error('Failed to revoke all sessions')
    }
  }

  /**
   * Get all active sessions for the user
   * @returns Array of active session information
   */
  async getActiveSessions(): Promise<SessionInfo[]> {
    const sessionSetKey = `user:${this.id}:sessions`
    const activeSessions: SessionInfo[] = []

    try {
      const sessions = await redis.smembers(sessionSetKey)

      for (const sessionId of sessions) {
        const sessionData = await redis.get(`session:${sessionId}`)
        if (sessionData) {
          try {
            const data: SessionData = JSON.parse(sessionData)
            activeSessions.push({
              sessionId,
              createdAt: data.createdAt,
              lastUsed: data.lastUsed,
              deviceInfo: data.deviceInfo,
              ipAddress: data.ipAddress,
              userAgent: data.userAgent,
            })
          } catch (error) {
            // Clean up corrupted session
            await redis.srem(sessionSetKey, sessionId)
            await redis.del(`session:${sessionId}`)
          }
        } else {
          // Clean up reference to non-existent session
          await redis.srem(sessionSetKey, sessionId)
        }
      }

      // Sort by last used (most recent first)
      return activeSessions.sort(
        (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
      )
    } catch (error) {
      console.error('Error getting active sessions:', error)
      return []
    }
  }

  /**
   * Clean up expired sessions for the user
   * This method can be called periodically or on login
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const sessionSetKey = `user:${this.id}:sessions`
      const sessions = await redis.smembers(sessionSetKey)
      const pipeline = redis.pipeline()

      for (const sessionId of sessions) {
        const exists = await redis.exists(`session:${sessionId}`)
        if (!exists) {
          pipeline.srem(sessionSetKey, sessionId)
        }
      }

      await pipeline.exec()
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error)
    }
  }

  /**
   * Logout user by revoking current session
   * @param sessionId - Current session ID to revoke
   */
  async logout(sessionId: string): Promise<void> {
    await this.revokeSession(sessionId)
  }

  /**
   * Check if user has supervisor role
   */
  isSupervisor(): boolean {
    return this.role === 'supervisor'
  }

  /**
   * Check if user has minero role
   */
  isMinero(): boolean {
    return this.role === 'minero'
  }

  /**
   * Get user's current session count
   */
  async getSessionCount(): Promise<number> {
    try {
      const sessionSetKey = `user:${this.id}:sessions`
      return await redis.scard(sessionSetKey)
    } catch (error) {
      console.error('Error getting session count:', error)
      return 0
    }
  }

  /**
   * Check if user has reached maximum session limit
   */
  async hasReachedSessionLimit(): Promise<boolean> {
    const sessionCount = await this.getSessionCount()
    return sessionCount >= 5
  }
}
