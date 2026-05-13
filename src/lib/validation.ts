/**
 * Input validation utilities for form data and API requests
 */

export type ValidationError = {
  field: string
  message: string
}

export class ValidationErrors extends Error {
  errors: ValidationError[]

  constructor(errors: ValidationError[]) {
    super(errors.map((e) => `${e.field}: ${e.message}`).join('; '))
    this.errors = errors
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): email is string {
  if (!email || typeof email !== 'string') return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email.trim())
}

/**
 * Validate phone number (basic: at least 7 digits)
 */
export function validatePhoneNumber(phone: string): phone is string {
  if (!phone || typeof phone !== 'string') return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7
}

/**
 * Validate product name (required, max 255 chars)
 */
export function validateProductName(name: string): name is string {
  return Boolean(name && typeof name === 'string' && name.trim().length > 0 && name.length <= 255)
}

/**
 * Validate price (must be positive number)
 */
export function validatePrice(price: number | string | null | undefined): number | null {
  if (price === null || price === undefined || price === '') return null
  const parsed = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(parsed) || parsed < 0) return null
  return parsed
}

/**
 * Validate stock quantity (must be non-negative integer)
 */
export function validateStock(stock: number | string): number {
  const parsed = typeof stock === 'string' ? parseInt(stock, 10) : stock
  return Math.max(0, isNaN(parsed) ? 0 : Math.floor(parsed))
}

/**
 * Validate quantity for purchase (must be positive integer)
 */
export function validateQuantity(qty: number | string): number {
  const parsed = typeof qty === 'string' ? parseInt(qty, 10) : qty
  if (isNaN(parsed) || parsed <= 0) return 1
  return Math.floor(parsed)
}

/**
 * Validate category name (required, max 100 chars)
 */
export function validateCategoryName(name: string): name is string {
  return Boolean(name && typeof name === 'string' && name.trim().length > 0 && name.length <= 100)
}

/**
 * Validate form data for new purchase
 */
export function validatePurchaseForm(data: {
  email?: string
  name?: string
  phone?: string
  quantity?: number | string
}): ValidationError[] {
  const errors: ValidationError[] = []

  if (!validateEmail(data.email || '')) {
    errors.push({ field: 'email', message: 'Email inválido' })
  }

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push({ field: 'name', message: 'Nombre es requerido' })
  }

  if (data.phone && !validatePhoneNumber(data.phone)) {
    errors.push({ field: 'phone', message: 'Teléfono inválido' })
  }

  const qty = validateQuantity(data.quantity || 1)
  if (qty < 1) {
    errors.push({ field: 'quantity', message: 'Cantidad debe ser mayor a 0' })
  }

  return errors
}

/**
 * Validate form data for new product
 */
export function validateProductForm(data: {
  name?: string
  price_list?: string | number | null
  price_cash?: string | number | null
  stock?: string | number
  category_id?: string | number
}): ValidationError[] {
  const errors: ValidationError[] = []

  if (!validateProductName(data.name || '')) {
    errors.push({ field: 'name', message: 'Nombre es requerido (máx 255 caracteres)' })
  }

  const priceList = validatePrice(data.price_list)
  const priceCash = validatePrice(data.price_cash)

  if (priceList === null && priceCash === null) {
    errors.push({ field: 'prices', message: 'Al menos un precio es requerido' })
  }

  if (priceList !== null && priceList < 0) {
    errors.push({ field: 'price_list', message: 'Precio debe ser positivo' })
  }

  if (priceCash !== null && priceCash < 0) {
    errors.push({ field: 'price_cash', message: 'Precio debe ser positivo' })
  }

  const stock = validateStock(data.stock || 0)
  if (stock < 0) {
    errors.push({ field: 'stock', message: 'Stock no puede ser negativo' })
  }

  return errors
}

/**
 * Safely parse API error response
 */
export function parseApiError(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    return {
      message: error.message || 'Error desconocido',
      code: (error as any).code,
    }
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as any
    if (obj.message) {
      return {
        message: String(obj.message),
        code: obj.code,
      }
    }
  }

  return {
    message: 'Error desconocido. Por favor intenta de nuevo.',
  }
}
