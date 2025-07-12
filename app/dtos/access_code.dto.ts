export interface CreateAccessCodeDto {
  correoSupervisor: string
}

export interface AccessCodeResponseDto {
  id: string
  codigo: string
  correoSupervisor: string
  usado: boolean
  fechaGeneracion: string
  fechaUso: string | null
  createdAt: string
  updatedAt: string | null
}
