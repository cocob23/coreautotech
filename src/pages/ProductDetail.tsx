import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getProductById } from '../lib/api'
import type { Product, ProductImage } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Price } from '../components/ui/Price'
import { useCart } from '../lib/cart'
import { HEADLIGHT_VARIANTS, isHeadlightProduct, getVariantLabelByKey, getVariantPriceMultiplier } from '../lib/productVariants'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState<(Product & { images: ProductImage[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [variantKey, setVariantKey] = useState<string>('')
  const [variantError, setVariantError] = useState<string | null>(null)

  useEffect(() => {
    const pid = Number(id)
    if (!pid) return
    getProductById(pid).then(setProduct).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    // Reset selected image when product changes
    setCurrentIndex(0)
  }, [product?.id])

  if (loading) return <div className="container py-8 text-neutral-400">Cargando...</div>
  if (!product) return <div className="container py-8 text-neutral-400">Producto no encontrado.</div>

  const imgs = product.images || []
  const isHeadlight = isHeadlightProduct(product)
  const variantMultiplier = getVariantPriceMultiplier(variantKey)
  const effectivePriceCash = product.price_cash != null ? Number(product.price_cash) * variantMultiplier : null
  const effectivePriceList = product.price_list != null ? Number(product.price_list) * variantMultiplier : null
  const effectiveBasePrice = Number(product.price) * variantMultiplier
  const mainImage = imgs[currentIndex]?.url
  const prevImage = () => {
    if (imgs.length === 0) return
    setCurrentIndex((i) => (i - 1 + imgs.length) % imgs.length)
  }
  const nextImage = () => {
    if (imgs.length === 0) return
    setCurrentIndex((i) => (i + 1) % imgs.length)
  }

  const agregarAlCarrito = () => {
    if (isHeadlight && !variantKey) {
      setVariantError('Selecciona una variante de farol para continuar')
      return
    }
    setVariantError(null)
    addItem(product, cantidad, {
      variantKey: isHeadlight ? variantKey : undefined,
      variantLabel: isHeadlight ? getVariantLabelByKey(variantKey) : undefined,
      priceMultiplier: isHeadlight ? getVariantPriceMultiplier(variantKey) : 1,
    })
  }

  const comprarAhora = () => {
    if (isHeadlight && !variantKey) {
      setVariantError('Selecciona una variante de farol para continuar')
      return
    }
    setVariantError(null)
    addItem(product, cantidad, {
      variantKey: isHeadlight ? variantKey : undefined,
      variantLabel: isHeadlight ? getVariantLabelByKey(variantKey) : undefined,
      priceMultiplier: isHeadlight ? getVariantPriceMultiplier(variantKey) : 1,
    })
    navigate('/carrito')
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-white">
            {mainImage ? (
              <button
                type="button"
                onClick={() => setIsImageOpen(true)}
                className="h-full w-full"
                aria-label="Ampliar imagen"
              >
                <img src={mainImage} alt={product.name} className="h-full w-full object-contain p-2" />
              </button>
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-500">Sin imagen</div>
            )}
            {imgs.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-neutral-800/60 px-2 py-1 text-xs sm:text-sm"
                  onClick={prevImage}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-neutral-800/60 px-2 py-1 text-xs sm:text-sm"
                  onClick={nextImage}
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          {imgs.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {imgs.map((img, idx) => (
                <button
                  key={img.id}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded border bg-white ${idx === currentIndex ? 'border-brand' : 'border-border'}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <img src={img.url} alt={`mini ${idx+1}`} className="h-full w-full rounded object-contain p-1" />
                </button>
              ))}
            </div>
          )}

          {isImageOpen && mainImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setIsImageOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsImageOpen(false)}
                className="absolute right-4 top-4 rounded-md border border-neutral-600 bg-neutral-900 px-3 py-1 text-sm text-white hover:bg-neutral-800"
                aria-label="Cerrar visor"
              >
                Cerrar
              </button>

              {imgs.length > 1 && (
                <button
                  type="button"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-md border border-neutral-600 bg-neutral-900/90 px-3 py-2 text-white hover:bg-neutral-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              <img
                src={mainImage}
                alt={product.name}
                className="max-h-[90vh] w-auto max-w-[95vw] rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {imgs.length > 1 && (
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-neutral-600 bg-neutral-900/90 px-3 py-2 text-white hover:bg-neutral-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl md:text-4xl">{product.name}</h1>
          <div className="mt-4 space-y-1">
            {effectivePriceList != null || effectivePriceCash != null ? (
              <>
                {effectivePriceList != null && (
                  <div className="flex flex-wrap items-baseline gap-1 text-2xl font-semibold sm:text-3xl">
                    <span className="text-sm font-medium text-neutral-400 sm:text-base">Precio (transferencia):</span>
                    <Price amount={effectivePriceList} className="text-neutral-100" integerClassName="text-2xl sm:text-3xl" centsClassName="text-[0.55em]" />
                  </div>
                )}
                {effectivePriceCash != null && (
                  <div className="flex flex-wrap items-baseline gap-1 text-base text-neutral-300 sm:text-lg">
                    <span className="font-medium text-neutral-400">Precio efectivo (local):</span>
                    <Price amount={effectivePriceCash} className="text-neutral-300" integerClassName="text-base sm:text-lg" centsClassName="text-[0.55em]" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-baseline gap-1 text-2xl font-semibold sm:text-3xl">
                <span className="text-sm font-medium text-neutral-400 sm:text-base">Precio:</span>
                <Price amount={effectiveBasePrice} className="text-neutral-100" integerClassName="text-2xl sm:text-3xl" centsClassName="text-[0.55em]" />
              </div>
            )}
          </div>
          <div className="mt-2 text-sm text-neutral-300">
            <span className="mr-2 text-neutral-400">Stock:</span>
            <Badge variant={product.in_stock ? 'success' : 'secondary'}>
              {product.in_stock ? 'EN STOCK' : 'SIN STOCK'}
            </Badge>
          </div>

          <div className="mt-8">
            {isHeadlight && (
              <div className="rounded-xl border border-neutral-700/80 bg-neutral-900/70 p-4">
                <label className="mb-3 block text-sm font-semibold text-neutral-100">Posición de farol</label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {HEADLIGHT_VARIANTS.map((variant) => {
                    const selected = variantKey === variant.key
                    return (
                      <button
                        key={variant.key}
                        type="button"
                        onClick={() => {
                          setVariantKey(variant.key)
                          setVariantError(null)
                        }}
                        className={`flex items-center justify-center text-center rounded-lg border px-3 py-2 text-sm font-medium leading-tight transition-colors ${
                          selected
                            ? 'border-green-500 bg-green-900/30 text-green-100'
                            : 'border-neutral-700 bg-neutral-950 text-neutral-200 hover:bg-neutral-900/90'
                        }`}
                      >
                        {variant.label}
                      </button>
                    )
                  })}
                </div>
                {variantError && <p className="mt-3 text-xs text-red-400">{variantError}</p>}
              </div>
            )}

            <div className="mt-10 border-t border-neutral-800 pt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">Cantidad:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, product.stock)}
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, Math.min(Number(e.target.value || 1), Math.max(1, product.stock))))}
                  className="w-16 rounded border border-border bg-neutral-900 px-2 py-1 text-sm"
                />
              </div>
              <div className="mt-7 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <Button size="lg" onClick={agregarAlCarrito} disabled={!product.in_stock} className="w-full border border-neutral-600 bg-neutral-800 text-base text-white hover:bg-neutral-700 sm:w-auto sm:min-w-[190px]">Agregar al carrito</Button>
                <Button size="lg" onClick={comprarAhora} disabled={!product.in_stock} className="w-full bg-green-600 text-base text-white hover:bg-green-500 sm:w-auto sm:min-w-[170px]">Comprar</Button>
              </div>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="md:col-span-2 mt-2 rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
            <h2 className="mb-2 text-lg font-semibold">Descripción</h2>
            <div className="whitespace-pre-line text-neutral-300">{product.description}</div>
          </div>
        )}
      </div>
    </div>
  )
}
