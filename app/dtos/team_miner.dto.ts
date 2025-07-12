export interface AssignMinerToTeamDto {
  mineroId: string
  equipoId: string
  fechaAsignacion: string // ISO
}

export interface RemoveMinerFromTeamDto {
  mineroId: string
  equipoId: string
  fechaSalida: string // ISO
}

export interface TeamMinerResponseDto {
  id: string
  mineroId: string
  equipoId: string
  activo: boolean
  fechaAsignacion: string
  fechaSalida: string | null
  createdAt: string
  updatedAt: string | null
}
