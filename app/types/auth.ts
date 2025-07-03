import type User from '#models/user'

export interface TokenData {
  userId: string
  email: string
  role: 'supervisor' | 'minero' | 'admin'
  cascoId: string | null
  createdAt: string
  sessionId?: string
  type?: 'access' | 'refresh'
}

export interface SessionData {
  userId: string
  refreshToken: string
  createdAt: string
  lastUsed: string
  deviceInfo?: string
  ipAddress?: string
  userAgent?: string
}

export interface SessionInfo {
  sessionId: string
  createdAt: string
  lastUsed: string
  deviceInfo?: string
  ipAddress?: string
  userAgent?: string
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: User
    tokenData?: TokenData
  }
}
