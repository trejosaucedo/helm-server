export interface RegisterSupervisorDto {
  fullName: string
  email: string
  password: string
}

export interface RegisterMineroDto {
  fullName: string
  email: string
  fechaContratacion?: string
  especialidadEnMineria?: string
  genero?: 'masculino' | 'femenino'
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
  estado: 'activo' | 'inactivo'
  fechaContratacion?: string | null
  especialidadEnMineria?: string | null
  genero?: 'masculino' | 'femenino' | null
  createdAt: string
  updatedAt: string | null
}
