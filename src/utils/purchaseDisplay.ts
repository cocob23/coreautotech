import type { LucideIcon } from 'lucide-react'
import { AlertCircle, CheckCircle, Clock, Package } from 'lucide-react'
import type { Purchase } from '../lib/types'
import { isPickupByNotes } from './purchaseFlow'

export type PurchaseStatusInfo = {
  label: string
  icon: LucideIcon
  color: string
  badge: string
}

export function getPurchaseStatusInfo(status: Purchase['estado']): PurchaseStatusInfo {
  const statusMap: Record<Purchase['estado'], PurchaseStatusInfo> = {
    pago_pendiente: {
      label: 'Pendiente de pago',
      icon: Clock,
      color: 'border-yellow-700/40 text-yellow-100',
      badge: 'bg-yellow-900/60 text-yellow-100 border border-yellow-700/50',
    },
    pago_recibido: {
      label: 'Esperando aprobación del pago',
      icon: CheckCircle,
      color: 'border-blue-700/40 text-blue-100',
      badge: 'bg-blue-900/60 text-blue-100 border border-blue-700/50',
    },
    aprobado: {
      label: 'Pago aprobado',
      icon: CheckCircle,
      color: 'border-green-700/40 text-green-100',
      badge: 'bg-green-900/60 text-green-100 border border-green-700/50',
    },
    por_enviar: {
      label: 'Por enviar',
      icon: Package,
      color: 'border-indigo-700/40 text-indigo-100',
      badge: 'bg-indigo-900/60 text-indigo-100 border border-indigo-700/50',
    },
    preparando_retiro: {
      label: 'Preparando el producto',
      icon: Package,
      color: 'border-amber-700/40 text-amber-100',
      badge: 'bg-amber-900/60 text-amber-100 border border-amber-700/50',
    },
    listo_para_retirar: {
      label: 'Listo para retirar',
      icon: CheckCircle,
      color: 'border-teal-700/40 text-teal-100',
      badge: 'bg-teal-900/60 text-teal-100 border border-teal-700/50',
    },
    enviado: {
      label: 'Enviado',
      icon: Package,
      color: 'border-purple-700/40 text-purple-100',
      badge: 'bg-purple-900/60 text-purple-100 border border-purple-700/50',
    },
    entregado: {
      label: 'Entregado',
      icon: CheckCircle,
      color: 'border-emerald-700/40 text-emerald-100',
      badge: 'bg-emerald-900/60 text-emerald-100 border border-emerald-700/50',
    },
    cancelado: {
      label: 'Cancelado',
      icon: AlertCircle,
      color: 'border-red-700/40 text-red-100',
      badge: 'bg-red-900/60 text-red-100 border border-red-700/50',
    },
  }

  return statusMap[status]
}

export const purchaseSteps: Array<{ key: Purchase['estado']; label: string }> = [
  { key: 'pago_pendiente', label: 'Esperando comprobante' },
  { key: 'pago_recibido', label: 'Esperando aprobación del pago' },
  { key: 'por_enviar', label: 'Por enviar' },
  { key: 'enviado', label: 'Enviado' },
  { key: 'entregado', label: 'Entregado' },
]

export const pickupPurchaseSteps: Array<{ key: Purchase['estado']; label: string }> = [
  { key: 'pago_pendiente', label: 'Esperando comprobante' },
  { key: 'pago_recibido', label: 'Esperando aprobación del pago' },
  { key: 'preparando_retiro', label: 'Preparando el producto' },
  { key: 'listo_para_retirar', label: 'Listo para retirar' },
]

export function getPurchaseCurrentStepIndex(status: Purchase['estado'], isPickup: boolean): number {
  const currentSteps = isPickup ? pickupPurchaseSteps : purchaseSteps
  const index = currentSteps.findIndex((step) => step.key === status)
  if (index >= 0) return index
  if (status === 'aprobado') return 2
  return 0
}

export function isPickupPurchase(purchase: Pick<Purchase, 'notas'>): boolean {
  return isPickupByNotes(purchase.notas)
}