import type { HttpContext } from '@adonisjs/core/http'

export class ResponseHelper {
  static success(response: HttpContext['response'], message: string, data?: any, status = 200) {
    return response.status(status).json({ success: true, message, data })
  }

  static error(response: HttpContext['response'], message: string, status = 400) {
    return response.status(status).json({ success: false, message, data: null })
  }

  static unauthorized(response: HttpContext['response'], message = 'No autorizado') {
    return this.error(response, message, 401)
  }

  static forbidden(response: HttpContext['response'], message = 'Prohibido') {
    return this.error(response, message, 403)
  }
}
