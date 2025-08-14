export interface CreateCascoDto {
  physicalId: string
  serial?: string
  supervisorId?: string | null
}

export interface ActivateCascoDto {
  cascoId: string
  supervisorId: string
  physicalId: string
}

export interface AssignCascoDto {
  cascoId: string
  mineroId: string
  supervisorId: string
}

export interface UnassignCascoDto {
  cascoId: string
  supervisorId: string
}

export interface DesactivateCascoDto {
  cascoId: string
  supervisorId: string
}

export interface CascoResponseDto {
  id: string
  serial: string
  physicalId: string
  isActive: boolean
  isAssigned: boolean
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
