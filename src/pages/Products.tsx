import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories, getProducts } from '../lib/api'
import ProductCard from '../components/ProductCard'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import type { Product, Category, ProductImage } from '../lib/types'

type ProductWithImages = Product & { images: ProductImage[]; category?: Category }

export default function Products() {
  const [params, setParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(params.get('search') ?? '')
  const category = params.get('category') ?? ''
  const inStockOnly = params.get('inStock') === 'true'

  const tuningCategories = [
    { name: 'Pantallas CarPlay', slug: 'pantallas-carplay' },
    { name: 'Faros Traseros', slug: 'faroles-tuning' },
    { name: 'Volantes Tuning', slug: 'volantes-tuning' },
  ]

  const isTuningCategory = category === 'tuning' || tuningCategories.some(c => c.slug === category)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([getCategories(), getProducts({ search, categorySlug: category || undefined, inStockOnly })])
      .then(([cats, prods]) => { setCategories(cats); setProducts(prods); })
      .catch((err) => {
        console.error('Error loading products:', err)
        setError('No se pudieron cargar los productos. Intenta de nuevo.')
      })
      .finally(() => setLoading(false))
  }, [search, category, inStockOnly])

  const applyFilters = () => {
    const next = new URLSearchParams()
    if (search) next.set('search', search)
    if (category) next.set('category', category)
    if (inStockOnly) next.set('inStock', 'true')
    setParams(next)
  }

  const categoryOptions = useMemo(() => [{ name: 'Todas', slug: '' }, ...categories.map((c: any) => ({ name: c.name, slug: c.slug }))], [categories])
  const formatCategoryTitle = (slug: string) =>
    slug === 'faroles-tuning'
      ? 'Faros Traseros'
      : slug
          .split('-')
          .filter(Boolean)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

  const pageTitle = category && category !== 'tuning' ? formatCategoryTitle(category) : 'Tuning & Accesorios'

  return (
    <div className="container py-8">
      {/* Subcategorías Tuning */}
      {category === 'tuning' && (
        <div className="mb-8">
          <h1 className="mb-4 text-2xl font-bold md:text-3xl">Pantallas & Tuning</h1>
          <p className="mb-4 text-neutral-300">Selecciona una categoría:</p>
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {tuningCategories.map((c) => (
              <a
                key={c.slug}
                href={`?category=${c.slug}`}
                className="rounded-lg border border-brand/30 bg-gradient-to-r from-brand/10 to-transparent p-4 hover:border-brand transition-colors"
              >
                <div className="text-lg font-semibold">{c.name}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <h1 className="mb-4 text-xl font-bold sm:text-2xl">{pageTitle}</h1>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="h-9 rounded-md border border-input bg-neutral-900 px-3 text-sm text-white" value={category} onChange={(e) => setParams((p) => { p.set('category', e.target.value); return p })}>
          {categoryOptions.map((c) => (
            <option className="bg-neutral-900 text-white" key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={inStockOnly} onChange={(e) => setParams((p) => { if (e.target.checked) p.set('inStock', 'true'); else p.delete('inStock'); return p })} />
          En stock
        </label>
        <Button onClick={applyFilters} className="w-full sm:w-auto">Aplicar filtros</Button>
      </div>
      {loading ? (
        <div className="text-neutral-400">Cargando productos...</div>
      ) : error ? (
        <div className="rounded-lg border border-red-700/40 bg-red-950/30 p-4 text-red-100">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-neutral-400">No hay productos con esos filtros.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id}>
              <ProductCard product={p} images={p.images} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
