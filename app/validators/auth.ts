import vine from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string(),
  })
)

export const registerSupervisorValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim(),
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8),
    codigo: vine.string().trim(),
  })
)

export const registerMineroValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim(),
    email: vine.string().email().normalizeEmail(),
    cascoId: vine.string().trim().optional(),
    supervisorId: vine.string().trim().optional(),
    fechaContratacion: vine.string().trim().optional(),
    especialidadEnMineria: vine.string().trim().optional(),
    genero: vine.enum(['masculino', 'femenino']).optional(),
    birthDate: vine.string().trim().optional(),
    phone: vine.string().trim().optional(),
    rfc: vine.string().trim().optional(),
    address: vine.string().trim().optional(),
  })
)

export const updateMineroValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().optional(),
    email: vine.string().email().normalizeEmail().optional(),
    cascoId: vine.string().trim().optional().nullable(),
    supervisorId: vine.string().trim().optional().nullable(),
    fechaContratacion: vine.string().trim().optional().nullable(),
    especialidadEnMineria: vine.string().trim().optional().nullable(),
    genero: vine.enum(['masculino', 'femenino']).optional().nullable(),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8),
  })
)

export const emailValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
  })
)

// Actualización de perfil (campos opcionales)
export const updateProfileValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().optional(),
    email: vine.string().email().normalizeEmail().optional(),
    phone: vine.string().trim().optional().nullable(),
    rfc: vine.string().trim().optional().nullable(),
    address: vine.string().trim().optional().nullable(),
    birthDate: vine.string().trim().optional().nullable(),
  })
)