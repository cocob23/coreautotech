import type { Purchase } from '../lib/types'

type ShippingMethod = 'retiro' | 'envio' | 'unknown'

export type ParsedShippingInfo = {
  method: ShippingMethod
  zone?: string
  address?: string
  locality?: string
  province?: string
  postalCode?: string
  reference?: string
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function isPickupByNotes(notes?: string | null): boolean {
  const text = normalizeText(notes || '')
  return (
    text.includes('entrega: retiro en deposito') ||
    text.includes('retiro en deposito') ||
    text.includes('retiro deposito') ||
    text.includes('retira en deposito')
  )
}

export function isPickupPurchase(purchase: Pick<Purchase, 'notas'>): boolean {
  return isPickupByNotes(purchase.notas)
}

function pickValue(notes: string, label: string): string | undefined {
  const regex = new RegExp(`${label}:\\s*([^|]+)`, 'i')
  const match = notes.match(regex)
  const value = match?.[1]?.trim()
  return value || undefined
}

export function parseShippingInfoFromNotes(notes?: string | null): ParsedShippingInfo {
  const raw = notes || ''
  const normalized = normalizeText(raw)

  const deliveryValue = pickValue(raw, 'Entrega')
  const deliveryNormalized = normalizeText(deliveryValue || '')

  let method: ShippingMethod = 'unknown'
  if (deliveryNormalized.includes('envio')) method = 'envio'
  if (deliveryNormalized.includes('retiro')) method = 'retiro'

  if (method === 'unknown') {
    method = isPickupByNotes(raw) ? 'retiro' : 'envio'
    if (!raw.trim()) method = 'unknown'
  }

  // Backward compatibility with previous notes format: "Envío a: ..."
  const legacyAddress = pickValue(raw, 'Envío a') || pickValue(raw, 'Envio a')

  const zone = pickValue(raw, 'Zona envío') || pickValue(raw, 'Zona envio')
  const address = pickValue(raw, 'Dirección envío') || pickValue(raw, 'Direccion envio') || legacyAddress
  const locality = pickValue(raw, 'Localidad envío') || pickValue(raw, 'Localidad envio')
  const province = pickValue(raw, 'Provincia envío') || pickValue(raw, 'Provincia envio')
  const postalCode = pickValue(raw, 'CP envío') || pickValue(raw, 'CP envio')
  const reference = pickValue(raw, 'Referencia envío') || pickValue(raw, 'Referencia envio')

  return {
    method,
    zone,
    address,
    locality,
    province,
    postalCode,
    reference,
  }
}
