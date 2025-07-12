export interface SendMessageDto {
  fromUserId: string
  toUserId?: string // Null para chat grupal
  equipoId?: string // Null para privado
  mensaje: string
}

export interface MessageResponseDto {
  id: string
  fromUserId: string
  toUserId: string | null
  equipoId: string | null
  mensaje: string
  readBy: string | null // JSON de IDs para chat grupal
  createdAt: string
  updatedAt: string | null
}
