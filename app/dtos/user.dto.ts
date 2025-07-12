export interface RegisterSupervisorDto {
  fullName: string
  email: string
  password: string
}

export interface RegisterMineroDto {
  fullName: string
  email: string
  cascoId?: string
  supervisorId?: string
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

export interface UpdateMineroDto {
  id: string
  fullName?: string
  email?: string
  cascoId?: string | null
  supervisorId?: string | null
  fechaContratacion?: string | null
  especialidadEnMineria?: string | null
  genero?: 'masculino' | 'femenino' | null
}

export interface UpdateSupervisorDto {
  id: string
  fullName?: string
  email?: string
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
  cascoId?: string | null
  supervisorId?: string | null
  createdAt: string
  updatedAt: string | null
}
