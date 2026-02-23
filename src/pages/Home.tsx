import { useEffect, useRef, useState } from 'react'
import { getProducts } from '../lib/api'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const PAGE_SIZE = 12
  const featuredCategories = [
    { name: 'Repuestos', slug: 'repuestos' },
    { name: 'Pantallas CarPlay', slug: 'pantallas-carplay' },
    { name: 'Faroles Tuning', slug: 'faroles-tuning' },
    { name: 'Volantes Tuning', slug: 'volantes-tuning' },
  ]
  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const next = await getProducts({ limit: PAGE_SIZE, offset: products.length })
      // Merge deduplicating by product id
      setProducts((prev) => {
        const seen = new Set(prev.map((x: any) => x.id))
        const merged = [...prev]
        for (const item of next) {
          if (!seen.has(item.id)) {
            merged.push(item)
            seen.add(item.id)
          }
        }
        return merged
      })
      if (next.length < PAGE_SIZE) setHasMore(false)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    // Primer lote
    loadMore()
  }, [])

  useEffect(() => {
    // IntersectionObserver para scroll infinito
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting) {
        loadMore()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMoreRef.current, products.length, hasMore])

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-black to-neutral-900">
        <div className="container py-8 md:py-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <img src="/logo.png" alt="Coreautotech" className="h-56 w-56 rounded transform scale-110 md:scale-125" onError={(e) => ((e.currentTarget.style.display = 'none'))} />
            <p className="text-neutral-400">LIDER en repuestos y accesorios tuning — calidad y estilo.</p>
          </div>
          <div className="mt-8 rounded-xl border border-border bg-black/40 p-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {featuredCategories.map((c) => (
                <a key={c.slug} href={`/products?category=${c.slug}`} className="rounded-lg border border-border bg-neutral-900 p-4 hover:border-brand">
                  <div className="text-sm text-neutral-400">Categoría</div>
                  <div className="text-lg font-semibold">{c.name}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12">
        <h2 className="mb-6 text-xl font-semibold">Novedades</h2>
        {loading && products.length === 0 ? (
          <div className="text-neutral-400">Cargando productos...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <div key={p.id}>
                  <ProductCard product={p} images={p.images} />
                </div>
              ))}
            </div>
            {/* Sentinel para scroll infinito */}
            {hasMore ? (
              <div ref={loadMoreRef} className="mt-8 h-10" aria-hidden />
            ) : (
              <div className="mt-8 text-center text-neutral-500">No hay más productos</div>
            )}
            {/* Fallback: botón para cargar más */}
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  disabled={loadingMore}
                  onClick={loadMore}
                  className="rounded-md border border-border bg-neutral-900 px-4 py-2 text-sm hover:border-brand disabled:opacity-50"
                >
                  {loadingMore ? 'Cargando…' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
