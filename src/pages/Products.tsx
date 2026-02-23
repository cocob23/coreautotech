import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getCategories, getProducts } from '../lib/api'
import ProductCard from '../components/ProductCard'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export default function Products() {
  const [params, setParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState(params.get('search') ?? '')
  const category = params.get('category') ?? ''
  const inStockOnly = params.get('inStock') === 'true'

  useEffect(() => {
    Promise.all([getCategories(), getProducts({ search, categorySlug: category || undefined, inStockOnly })])
      .then(([cats, prods]) => { setCategories(cats); setProducts(prods); })
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

  return (
    <div className="container py-8">
      <h1 className="mb-4 text-2xl font-bold">Productos</h1>
      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
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
        <Button onClick={applyFilters}>Aplicar filtros</Button>
      </div>
      {loading ? (
        <div className="text-neutral-400">Cargando...</div>
      ) : products.length === 0 ? (
        <div className="text-neutral-400">No hay productos con esos filtros.</div>
      ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
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
