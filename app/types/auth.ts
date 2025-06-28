import type User from '#models/user'

export interface TokenData {
  userId: string
  email: string
  role: 'supervisor' | 'minero'
  cascoId: string | null
  createdAt: string
}

export interface AuthenticatedContext {
  user: User
  tokenData: TokenData
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    user?: User
    tokenData?: TokenData
  }
}
