import vine from '@vinejs/vine'

export const activateCascoValidator = vine.compile(
  vine.object({
    physicalId: vine.string().trim(),
  })
)

export const assignCascoValidator = vine.compile(
  vine.object({
    cascoId: vine.string().trim(),
    mineroId: vine.string().trim(),
  })
)

export const createCascoValidator = vine.compile(
  vine.object({
    physicalId: vine.string().trim().minLength(3),
    serial: vine.string().trim().optional(),
    supervisorId: vine.string().trim().optional().nullable(),
  })
)

export const updateCascoValidator = vine.compile(
  vine.object({
    serial: vine.string().trim().optional(),
    physicalId: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
    supervisorId: vine.string().trim().optional().nullable(),
    mineroId: vine.string().trim().optional().nullable(),
  })
)
