import type { UserResponseDto } from '#dtos/user.dto'

export interface TokenData {
  userId: string
  email: string
  role: 'supervisor' | 'minero' | 'admin'
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
    user?: UserResponseDto
    tokenData?: TokenData
  }
}
