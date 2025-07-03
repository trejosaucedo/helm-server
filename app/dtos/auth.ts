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

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface UserResponseDto {
  id: string
  fullName: string | null
  email: string
  role: 'supervisor' | 'minero' | 'admin'
  cascoId?: string | null
  createdAt: string
  updatedAt: string | null
  temporaryPassword?: string
  message?: string
}
