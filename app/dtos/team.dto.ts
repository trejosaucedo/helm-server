export interface CreateTeamDto {
  nombre: string
  zona: string
  supervisorId: string
}

export interface UpdateTeamDto {
  id: string
  nombre?: string
  zona?: string
}

export interface TeamResponseDto {
  id: string
  nombre: string
  zona: string
  supervisorId: string
  createdAt: string
  updatedAt: string | null
}
