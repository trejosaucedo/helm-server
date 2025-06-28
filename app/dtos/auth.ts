// dtos/auth.ts

export interface RegisterSupervisorDto {
  fullName: string
  email: string
  password: string
}

export interface RegisterMineroDto {
  fullName: string
  email: string
  cascoId: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponseDto {
  user: {
    id: string
    fullName: string | null
    email: string
    role: 'supervisor' | 'minero'
    cascoId: string | null
    createdAt: string
    updatedAt: string | null
  }
  token: string
}

export interface UserResponseDto {
  id: string
  fullName: string | null
  email: string
  role: 'supervisor' | 'minero'
  cascoId: string | null
  createdAt: string
  updatedAt: string | null
}

export interface MineroRegistrationResponseDto {
  user: UserResponseDto
  temporaryPassword: string
  message: string
}
