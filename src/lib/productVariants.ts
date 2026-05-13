import type { Product } from './types'

export type HeadlightVariantKey = 'izquierdo_conductor' | 'derecho_acompanante' | 'ambos_lados'

export type ProductVariant = {
  key: string
  label: string
}

export const HEADLIGHT_VARIANTS: ProductVariant[] = [
  { key: 'izquierdo_conductor', label: 'Izquierdo/Conductor' },
  { key: 'derecho_acompanante', label: 'Derecho/Acompañante' },
  { key: 'ambos_lados', label: 'Ambos Lados' },
]

export function isHeadlightProduct(product: Pick<Product, 'name' | 'description'>): boolean {
  const text = `${product.name} ${product.description ?? ''}`.toLowerCase()
  return text.includes('farol') || text.includes('faro')
}

export function getVariantLabelByKey(key: string): string {
  return HEADLIGHT_VARIANTS.find((v) => v.key === key)?.label || key
}

export function getVariantPriceMultiplier(key?: string): number {
  return key === 'ambos_lados' ? 2 : 1
}
