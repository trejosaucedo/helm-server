export interface CreateCascoDto {
  serial: string
}

export interface ActivateCascoDto {
  cascoId: string
  supervisorId: string
}

export interface AssignCascoDto {
  cascoId: string
  mineroId: string
}

export interface UnassignCascoDto {
  cascoId: string
}

export interface DesactivateCascoDto {
  cascoId: string
}

export interface CascoResponseDto {
  id: string
  serial: string
  supervisorId: string | null
  mineroId: string | null
  asignadoSupervisor: boolean
  asignadoMinero: boolean
  fechaActivacion: string | null
  createdAt: string
  updatedAt: string | null
  minero?: {
    id: string
    fullName: string | null
    email: string
  }
}
