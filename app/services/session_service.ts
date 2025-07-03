import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import type { TokenData, SessionData, SessionInfo } from '#types/auth'
import { SessionRepository } from '#repositories/session_repository'
import User from '#models/user'

export class SessionService {
  static SESSION_TTL = 7 * 24 * 60 * 60 // 7 días en segundos
  static MAX_SESSIONS = 5

  static async createSession(
    user: User,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const sessionId = crypto.randomBytes(32).toString('hex')
    const refreshToken = crypto.randomBytes(64).toString('hex')
    const now = new Date().toISOString()

    // Control de sesiones máximas
    await this.ensureSessionLimit(user.id)

    const sessionData: SessionData = {
      userId: user.id,
      refreshToken,
      createdAt: now,
      lastUsed: now,
      deviceInfo,
      ipAddress,
      userAgent,
    }

    await SessionRepository.saveSession(sessionId, sessionData, this.SESSION_TTL)
    await SessionRepository.addUserSession(user.id, sessionId, this.SESSION_TTL)

    // JWT access token
    const accessTokenData: TokenData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      cascoId: user.cascoId,
      createdAt: now,
      sessionId,
      type: 'access',
    }

    const accessToken = jwt.sign(accessTokenData, env.get('JWT_SECRET'), {
      expiresIn: '15m',
      issuer: 'HELM-API',
      audience: 'HELM-API-Users',
    })

    return { accessToken, sessionId, refreshToken }
  }

  static async ensureSessionLimit(userId: string) {
    const sessionCount = await SessionRepository.getSessionCount(userId)
    if (sessionCount >= this.MAX_SESSIONS) {
      await SessionRepository.removeOldestSessions(userId, this.MAX_SESSIONS - 1)
    }
  }

  static async revokeSession(userId: string, sessionId: string) {
    await SessionRepository.deleteSession(sessionId)
    await SessionRepository.removeUserSession(userId, sessionId)
  }

  static async revokeAllSessions(userId: string) {
    const sessionIds = await SessionRepository.getUserSessions(userId)
    for (const sessionId of sessionIds) {
      await SessionRepository.deleteSession(sessionId)
    }
    await SessionRepository.clearUserSessions(userId)
  }

  static async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    const sessionIds = await SessionRepository.getUserSessions(userId)
    const activeSessions: SessionInfo[] = []
    for (const sessionId of sessionIds) {
      const data = await SessionRepository.getSession(sessionId)
      if (data) {
        activeSessions.push({
          sessionId,
          createdAt: data.createdAt,
          lastUsed: data.lastUsed,
          deviceInfo: data.deviceInfo,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        })
      } else {
        await SessionRepository.removeUserSession(userId, sessionId)
      }
    }
    return activeSessions.sort(
      (a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    )
  }

  static async cleanupExpiredSessions(userId: string) {
    await SessionRepository.cleanupExpiredSessions(userId)
  }

  static async updateSessionLastUsed(sessionId: string) {
    await SessionRepository.updateSessionLastUsed(sessionId)
  }

  static async refreshAccessToken(sessionId: string): Promise<string | null> {
    const session = await SessionRepository.getSession(sessionId)
    if (!session) return null
    const user = await User.find(session.userId)
    if (!user) return null
    await this.updateSessionLastUsed(sessionId)

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
  }

  static async validateSession(sessionId: string): Promise<User | null> {
    const session = await SessionRepository.getSession(sessionId)
    if (!session) return null
    const user = await User.find(session.userId)
    if (user) await this.updateSessionLastUsed(sessionId)
    return user
  }

  static async validateAccessToken(
    token: string
  ): Promise<{ user: User; tokenData: TokenData } | null> {
    try {
      const decoded = jwt.verify(token, env.get('JWT_SECRET'), {
        issuer: 'HELM-API',
        audience: 'HELM-API-Users',
      }) as TokenData

      if (decoded.type !== 'access' || !decoded.sessionId) return null

      const exists = await SessionRepository.sessionExists(decoded.sessionId)
      if (!exists) return null

      await this.updateSessionLastUsed(decoded.sessionId)

      const user = await User.find(decoded.userId)
      if (!user) return null

      return { user, tokenData: decoded }
    } catch (err) {
      return null
    }
  }

  static async sessionExists(sessionId: string): Promise<boolean> {
    return SessionRepository.sessionExists(sessionId)
  }
}
