export interface UpdateMineroData {
  id: string
  fullName?: string
  email?: string
  cascoId?: string | null
}

export interface UpdateSupervisorData {
  id: string
  fullName?: string
  email?: string
}

export interface UserData {
  id: string
  fullName: string | null
  email: string
  role: 'supervisor' | 'minero'
  cascoId: string | null
  createdAt: Date
  updatedAt: Date | null
}
