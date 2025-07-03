export interface ActivateCascoDto {
  physicalId: string
  supervisorId: string
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
  physicalId: string
  supervisorId: string
  mineroId: string | null
  isActive: boolean
  isAssigned: boolean
  createdAt: string
  updatedAt: string | null
  minero?: {
    id: string
    fullName: string | null
    email: string
  }
}

export interface CreateCascoDto {
  supervisorId?: string
  physicalId: string
}
