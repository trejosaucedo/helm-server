import { ResponseHelper } from '#utils/response_helper'
import { HttpContext } from '@adonisjs/core/http'

export class ErrorHandler {
  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message)
    }
    return 'Error desconocido'
  }

  static handleError(
    error: unknown,
    response: HttpContext['response'],
    defaultMessage: string,
    defaultStatus = 500
  ) {
    const message = this.getErrorMessage(error)
    return ResponseHelper.error(response, message || defaultMessage, defaultStatus)
  }

  static logError(error: unknown, context?: string) {
    const message = this.getErrorMessage(error)
    console.error(`[${context || 'ERROR'}]:`, message)
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack)
    }
  }
}
