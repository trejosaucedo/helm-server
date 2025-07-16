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
    cascoId: vine.string().trim(),
  })
)

export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8),
  })
)
