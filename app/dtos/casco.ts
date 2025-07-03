export interface ActivateCascoDto {
  physicalId: string
}

export interface AssignCascoDto {
  cascoId: string
  mineroId: string
}

export interface CreateCascoDto {
  supervisorId: string
  physicalId: string
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

export interface CreateMineroDto {
  fullName: string
  email: string
  cascoId: string
}
