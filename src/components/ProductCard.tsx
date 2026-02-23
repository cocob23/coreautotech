import { Link } from 'react-router-dom'
import type { Product, ProductImage } from '../lib/types'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

export default function ProductCard({ product, images }: { product: Product; images: ProductImage[] }) {
  const img = images?.[0]?.url
  return (
    <div className="group rounded-lg border border-border bg-black/40">
      <Link to={`/products/${product.id}`} className="block">
        <div className="aspect-[4/3] overflow-hidden rounded-t-lg bg-neutral-900">
          {img ? (
            <img src={img} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-500">Sin imagen</div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{product.name}</h3>
          <Badge variant={product.in_stock ? 'default' : 'secondary'}>
            {product.in_stock ? 'En stock' : 'Sin stock'}
          </Badge>
        </div>
        {product.price_cash != null || product.price_list != null ? (
          <div className="mt-2 text-sm">
            {product.price_cash != null && (
              <div><span className="text-neutral-400">Efectivo:</span> <span className="font-semibold">${product.price_cash.toFixed(2)}</span></div>
            )}
            {product.price_list != null && (
              <div className="text-neutral-300"><span className="text-neutral-400">Lista:</span> ${product.price_list.toFixed(2)}</div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-lg font-semibold">${product.price.toFixed(2)}</p>
        )}
        <div className="mt-3 flex justify-end">
          <Button asChild>
            <Link to={`/products/${product.id}`}>Ver detalle</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
