import type User from '#models/user'

export interface TokenData {
  userId: string
  email: string
  role: 'supervisor' | 'minero'
  cascoId: string | null
  createdAt: string
  sessionId?: string
  type?: 'access' | 'refresh'
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: User
    tokenData?: TokenData
  }
}
