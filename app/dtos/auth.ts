export interface RegisterSupervisorDto {
  fullName: string
  email: string
  password: string
}

export interface RegisterMineroDto {
  fullName: string
  email: string
  cascoId: string // ID del casco que se le asignará
}

export interface LoginDto {
  email: string
  password: string
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface AuthResponseDto {
  user: {
    id: string
    fullName: string | null
    email: string
    role: 'supervisor' | 'minero'
    cascoId?: string | null
    createdAt: string
    updatedAt: string | null
  }
  accessToken: string
  refreshToken: string
  sessionId: string
}

export interface RefreshTokenResponseDto {
  accessToken: string
  user: {
    id: string
    fullName: string | null
    email: string
    role: 'supervisor' | 'minero'
    cascoId?: string | null
    createdAt: string
    updatedAt: string | null
  }
}

export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}

export interface UserResponseDto {
  id: string
  fullName: string | null
  email: string
  role: 'supervisor' | 'minero'
  cascoId?: string | null
  createdAt: string
  updatedAt: string | null
}

export interface MineroRegistrationResponseDto {
  user: UserResponseDto
  temporaryPassword: string
  message: string
}
