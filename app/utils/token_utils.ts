import type { HttpContext } from '@adonisjs/core/http'

export class TokenUtils {
  static extractFromRequest(request: any): string | null {
    const authHeader = request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    return authHeader.slice(7).trim() || null
  }

  static extractFromContext(ctx: HttpContext): string | null {
    return this.extractFromRequest(ctx.request)
  }
}
