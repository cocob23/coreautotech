/**
 * Accessibility utilities and helpers for WCAG compliance
 */

import React from 'react'

/**
 * Generate accessible id for form fields
 */
export function generateFieldId(fieldName: string, suffix?: string): string {
  const id = fieldName.replace(/\s+/g, '-').toLowerCase()
  return suffix ? `${id}-${suffix}` : id
}

/**
 * Format currency for screen readers
 */
export function formatCurrencyAccessible(amount: number, currency: string = 'ARS'): {
  numeric: string
  accessible: string
} {
  const numeric = amount.toFixed(2)
  const currencySymbol = currency === 'ARS' ? '$' : currency
  return {
    numeric,
    accessible: `${numeric} ${currency}`,
  }
}

/**
 * Get ARIA label for product status
 */
export function getProductStatusAriaLabel(inStock: boolean): string {
  return inStock ? 'Producto disponible en stock' : 'Producto no disponible en este momento'
}

/**
 * Format purchase status for screen readers
 */
export function getPurchaseStatusAriaLabel(estado: string): string {
  const labels: Record<string, string> = {
    pago_pendiente: 'Pago pendiente de envíar',
    pago_recibido: 'Comprobante recibido, esperando aprobación',
    aprobado: 'Pago aprobado por el vendedor',
    por_enviar: 'Producto listo para enviar',
    preparando_retiro: 'Producto se está preparando para retirar',
    listo_para_retirar: 'Producto listo para retirar en el local',
    enviado: 'Producto enviado al transporte',
    entregado: 'Producto entregado al cliente',
    cancelado: 'Compra cancelada',
  }
  return labels[estado] || estado
}

/**
 * Create a visually hidden text for screen readers
 */
export const srOnly = 'sr-only'

/**
 * Tailwind class for sr-only (you should add this to your globals.css):
 * .sr-only {
 *   position: absolute;
 *   width: 1px;
 *   height: 1px;
 *   padding: 0;
 *   margin: -1px;
 *   overflow: hidden;
 *   clip: rect(0, 0, 0, 0);
 *   white-space: nowrap;
 *   border-width: 0;
 * }
 */

/**
 * Generate skip navigation button element
 */
export function SkipToMainContent() {
  return React.createElement(
    'a',
    {
      href: '#main-content',
      className: `${srOnly} focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:bg-brand focus:text-black focus:px-4 focus:py-2 focus:rounded-lg`
    },
    'Ir al contenido principal'
  )
}
