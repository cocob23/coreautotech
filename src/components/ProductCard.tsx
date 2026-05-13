import { Link, useNavigate } from 'react-router-dom'
import { memo } from 'react'
import type { Product, ProductImage } from '../lib/types'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { Price } from './ui/Price'
import { useCart } from '../lib/cart'
import { isHeadlightProduct } from '../lib/productVariants'

function ProductCardComponent({ product, images }: { product: Product; images: ProductImage[] }) {
  const img = images?.[0]?.url
  const { addItem } = useCart()
  const navigate = useNavigate()
  const isHeadlight = isHeadlightProduct(product)

  const handleAddToCart = () => {
    addItem({ ...product, images }, 1)
  }

  return (
    <div
      className="group cursor-pointer rounded-lg border border-border bg-black/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-500 hover:bg-black/55"
      onClick={() => navigate(`/products/${product.id}`)}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/products/${product.id}`)
        }
      }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg bg-white">
        {img ? (
          <img src={img} alt={product.name} className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-500">Sin imagen</div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
        <div className="pointer-events-none absolute bottom-2 right-2 rounded-full border border-white/30 bg-black/55 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 translate-y-1">
          Ver producto
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-medium">{product.name}</h3>
          <Badge
            variant={product.in_stock ? 'success' : 'secondary'}
            className="shrink-0 whitespace-nowrap px-2 py-0.5 text-[11px] leading-none"
          >
            {product.in_stock ? 'En stock' : 'Sin stock'}
          </Badge>
        </div>
        {product.price_cash != null || product.price_list != null ? (
          <div className="mt-2 text-sm">
            {product.price_list != null && (
              <div className="flex flex-wrap items-baseline gap-1 font-semibold text-neutral-100">
                <span className="text-neutral-400">Transferencia:</span>
                <Price amount={product.price_list} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" />
              </div>
            )}
            {product.price_cash != null && (
              <div className="flex flex-wrap items-baseline gap-1 text-neutral-400">
                <span className="text-neutral-500">Local:</span>
                <Price amount={product.price_cash} className="text-neutral-400" integerClassName="text-sm" centsClassName="text-[0.55em]" />
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-lg font-semibold"><Price amount={product.price} className="font-semibold text-neutral-100" integerClassName="text-lg" centsClassName="text-[0.6em]" /></p>
        )}
        <div className="mt-3 flex items-center gap-2 justify-end">
          {isHeadlight ? (
            <Button asChild className="border border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700">
              <Link
                to={`/products/${product.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                Elegir posición
              </Link>
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleAddToCart()
              }}
              disabled={!product.in_stock}
              className="border border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700"
            >
              Agregar al carrito
            </Button>
          )}
          <Button asChild className="bg-green-600 text-white hover:bg-green-500">
            <Link
              to={`/products/${product.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              Comprar
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export default memo(ProductCardComponent, (prev, next) => {
  // Only re-render if product id or images changed
  return prev.product.id === next.product.id && 
         prev.images[0]?.id === next.images[0]?.id
})
