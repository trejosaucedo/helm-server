export interface UpdateMineroDto {
  id: string
  fullName?: string
  email?: string
  cascoId?: string | null
}

export interface UpdateSupervisorDto {
  id: string
  fullName?: string
  email?: string
}
