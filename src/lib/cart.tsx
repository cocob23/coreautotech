import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from './types'

// Storage keys - using V2 to clear old carts with price_cash
// Nueva versión usa precio de lista como principal
const STORAGE_KEY_V2 = 'coreautotech_cart_v2_lista_prices'

export type CartItem = {
  lineId: string
  productId: number
  name: string
  imageUrl?: string
  priceUnit: number
  quantity: number
  stock: number
  variantKey?: string
  variantLabel?: string
}

type AddItemOptions = {
  variantKey?: string
  variantLabel?: string
  priceMultiplier?: number
}

type CartContextValue = {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  addItem: (product: Product & { images?: { url: string }[] }, quantity?: number, options?: AddItemOptions) => void
  removeItem: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function getUnitPrice(product: Product): number {
  if (product.price_list != null) return Number(product.price_list)
  if (product.price_cash != null) return Number(product.price_cash)
  return Number(product.price)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V2)
      if (!raw) return
      const parsed = JSON.parse(raw) as CartItem[]
      if (Array.isArray(parsed)) setItems(parsed)
    } catch {
      // ignore parse/storage errors
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(items))
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
    const totalAmount = items.reduce((acc, item) => acc + item.quantity * item.priceUnit, 0)

    return {
      items,
      totalItems,
      totalAmount,
      addItem: (product, quantity = 1, options) => {
        const qty = Math.max(1, Math.floor(quantity))
        const imageUrl = product.images?.[0]?.url
        const basePrice = getUnitPrice(product)
        const priceMultiplier = options?.priceMultiplier ?? 1
        const priceUnit = basePrice * priceMultiplier
        const lineId = `${product.id}:${options?.variantKey || 'default'}`

        setItems((prev) => {
          const existing = prev.find((x) => x.lineId === lineId)
          if (!existing) {
            return [
              ...prev,
              {
                lineId,
                productId: product.id,
                name: product.name,
                imageUrl,
                priceUnit,
                quantity: Math.min(qty, Math.max(product.stock, 1)),
                stock: product.stock,
                variantKey: options?.variantKey,
                variantLabel: options?.variantLabel,
              },
            ]
          }

          const nextQty = Math.min(existing.quantity + qty, Math.max(existing.stock, 1))
          return prev.map((x) => (x.lineId === lineId ? { ...x, quantity: nextQty } : x))
        })
      },
      removeItem: (lineId) => {
        setItems((prev) => prev.filter((x) => x.lineId !== lineId))
      },
      updateQuantity: (lineId, quantity) => {
        setItems((prev) => {
          if (quantity <= 0) return prev.filter((x) => x.lineId !== lineId)
          return prev.map((x) => {
            if (x.lineId !== lineId) return x
            const q = Math.min(Math.floor(quantity), Math.max(x.stock, 1))
            return { ...x, quantity: Math.max(1, q) }
          })
        })
      },
      clearCart: () => setItems([]),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
