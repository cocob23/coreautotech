/**
 * Centralized error logging and handling
 */

export type ErrorSeverity = 'info' | 'warning' | 'error'

export interface ErrorLog {
  message: string
  severity: ErrorSeverity
  context?: Record<string, any>
  timestamp: Date
  stack?: string
  userId?: string
}

class ErrorLogger {
  private logs: ErrorLog[] = []
  private maxLogs = 100

  log(message: string, context?: Record<string, any>, severity: ErrorSeverity = 'error') {
    const error = new Error(message)
    const errorLog: ErrorLog = {
      message,
      severity,
      context,
      timestamp: new Date(),
      stack: error.stack,
    }

    this.logs.push(errorLog)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Also log to console in development
    if (import.meta.env.DEV) {
      const logFn = severity === 'error' ? console.error : severity === 'warning' ? console.warn : console.log
      logFn(`[${severity.toUpperCase()}] ${message}`, context)
    }
  }

  /**
   * Log an API error with optional context
   */
  logApiError(endpoint: string, error: unknown, context?: Record<string, any>) {
    const message = error instanceof Error ? error.message : String(error)
    this.log(`API Error: ${endpoint} - ${message}`, { endpoint, ...context }, 'error')
  }

  /**
   * Log a UI error (e.g., form validation)
   */
  logUiError(action: string, message: string, context?: Record<string, any>) {
    this.log(`UI Error: ${action} - ${message}`, { action, ...context }, 'error')
  }

  /**
   * Get all logs
   */
  getLogs(): readonly ErrorLog[] {
    return this.logs
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = []
  }

  /**
   * Get recent logs
   */
  getRecent(count: number = 10): readonly ErrorLog[] {
    return this.logs.slice(-count)
  }
}

export const errorLogger = new ErrorLogger()

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal error details to users
    const message = error.message.toLowerCase()
    if (message.includes('network')) return 'Error de conexión. Intenta de nuevo.'
    if (message.includes('timeout')) return 'La solicitud tardó demasiado. Intenta de nuevo.'
    if (message.includes('unauthorized') || message.includes('forbidden')) return 'No tienes permiso para realizar esta acción.'
    if (message.includes('not found')) return 'El recurso no fue encontrado.'

    // For development, show the actual message
    return import.meta.env.DEV ? error.message : 'Algo salió mal. Intenta de nuevo.'
  }

  if (typeof error === 'string') return error
  return 'Error desconocido. Intenta de nuevo.'
}
