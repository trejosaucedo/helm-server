import vine from '@vinejs/vine'

export const createTeamValidator = vine.compile(
  vine.object({
    nombre: vine.string().minLength(1).maxLength(100),
    zona: vine.string().minLength(1).maxLength(100),
    supervisorId: vine.string().uuid(),
  })
)

export const assignMinerValidator = vine.compile(
  vine.object({
    teamId: vine.string().uuid(),
    mineroId: vine.string().uuid(),
  })
)
