import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class IsAdmin {
  public async handle(ctx: HttpContext, next: NextFn) {
    const { user, response } = ctx

    if (!user || user.role !== 'admin') {
      return response.forbidden({
        success: false,
        message: 'Se requiere permiso de administrador',
        data: null,
      })
    }

    await next()
  }
}
