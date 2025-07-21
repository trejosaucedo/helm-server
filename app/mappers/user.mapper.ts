import type User from '#models/user'
import type { UserResponseDto } from '#dtos/user.dto'

export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    estado: user.estado,
    fechaContratacion: user.fechaContratacion ?? null,
    especialidadEnMineria: user.especialidadEnMineria ?? null,
    genero: user.genero ?? null,
    cascoId: user.cascoId ?? null,
    supervisorId: user.supervisorId ?? null,
    birthDate: user.birthDate ?? null,
    phone: user.phone ?? null,
    rfc: user.rfc ?? null,
    address: user.address ?? null,
    createdAt: user.createdAt ? user.createdAt.toISO()! : new Date().toISOString(),
    updatedAt: user.updatedAt ? user.updatedAt.toISO() : null,
  }
}
