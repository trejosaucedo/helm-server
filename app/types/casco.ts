export interface CascoData {
  id: string
  physicalId: string
  supervisorId: string
  mineroId: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date | null
}

export interface CascoAssignmentData {
  cascoId: string
  mineroId: string
  assignedAt: Date
}
