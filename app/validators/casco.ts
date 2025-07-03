import vine from '@vinejs/vine'

export const activateCascoValidator = vine.compile(
  vine.object({
    physicalId: vine.string().trim(),
  })
)

export const createCascoValidator = vine.compile(
  vine.object({
    supervisorId: vine.string().uuid(),
    physicalId:   vine.string().trim(),
  })
)

export const assignCascoValidator = vine.compile(
  vine.object({
    cascoId:   vine.string().trim(),
    mineroId:  vine.string().trim(),
  })
)
