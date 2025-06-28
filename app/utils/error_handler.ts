import { HttpContext } from '@adonisjs/core/http'

export class ErrorHandler {
  /**
   * Extrae mensaje de error de cualquier tipo de error
   */
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message)
    }
    return 'Error desconocido'
  }

  /**
   * Determina el código de estado HTTP basado en el mensaje de error
   */
  static getErrorStatus(error: unknown, defaultStatus = 500): number {
    const message = this.getErrorMessage(error)

    // Mapeo específico de errores a códigos HTTP
    if (message.includes('ya está registrado')) return 409
    if (message.includes('no encontrado') || message.includes('not found')) return 404
    if (message.includes('no autorizado') || message.includes('unauthorized')) return 401
    if (message.includes('prohibido') || message.includes('forbidden')) return 403
    if (message.includes('validación') || message.includes('validation')) return 422

    return defaultStatus
  }

  /**
   * Maneja respuesta de error completa
   */
  static handleError(
    error: unknown,
    response: HttpContext['response'],
    defaultMessage: string,
    defaultStatus = 500
  ) {
    const message = this.getErrorMessage(error)
    const status = this.getErrorStatus(error, defaultStatus)

    return response.status(status).json({
      message: message || defaultMessage,
      error: true,
    })
  }

  /**
   * Para logging (opcional)
   */
  static logError(error: unknown, context?: string) {
    const message = this.getErrorMessage(error)
    console.error(`[${context || 'ERROR'}]:`, message)

    // Aquí puedes agregar logging a archivos, servicios externos, etc.
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack)
    }
  }
}
