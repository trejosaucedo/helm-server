export interface CreateAuditLogDto {
  usuarioId: string
  accion: string
  descripcion: string
  fecha: string
}

export interface AuditLogResponseDto {
  id: string //_id de Mongo
  usuarioId: string
  accion: string
  descripcion: string
  fecha: string
  createdAt: string
}
