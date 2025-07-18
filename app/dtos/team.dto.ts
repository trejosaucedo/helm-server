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

export interface TeamMinerResponseDto {
  id: string
  nombre: string
  fechaAsignacion: string
  fechaSalida: string | null
  zona: string
}

export interface AssignMinerDto {
  teamId: string
  mineroId: string
}
