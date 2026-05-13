import { useEffect, useRef, useState, useCallback } from 'react'
import { getCategories, getProducts } from '../lib/api'
import ProductCard from '../components/ProductCard'
import type { Category, Product, ProductImage } from '../lib/types'

type ProductWithImages = Product & { images: ProductImage[] }

export default function Home() {
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const PAGE_SIZE = 12

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const resolveCategoryHref = (preferredSlugs: string[], fallbackHref: string) => {
    const exact = categories.find((cat) => preferredSlugs.includes(cat.slug))
    if (exact) return `/products?category=${exact.slug}`

    const byName = categories.find((cat) => {
      const n = normalize(cat.name)
      return preferredSlugs.some((slug) => n.includes(slug.replace(/-/g, ' ')))
    })
    if (byName) return `/products?category=${byName.slug}`

    return fallbackHref
  }

  const mainCategories = [
    {
      name: 'Repuestos',
      description: 'Faroles, espejos y paragolpes',
      href: resolveCategoryHref(['repuestos', 'repuesto'], '/repuestos'),
    },
    {
      name: 'Pantallas',
      description: 'Pantallas y multimedia',
      href: resolveCategoryHref(['pantallas', 'pantalla', 'pantallas-carplay'], '/products'),
    },
    {
      name: 'Faroles traseros',
      description: 'Modelos originales y tuning',
      href: resolveCategoryHref(['faroles-traseros', 'faroles', 'faroles-tuning'], '/products'),
    },
    {
      name: 'Volantes',
      description: 'Volantes y accesorios',
      href: resolveCategoryHref(['volantes', 'volantes-tuning'], '/products'),
    },
  ]
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setError(null)
    try {
      const next = await getProducts({ limit: PAGE_SIZE, offset: products.length })
      // Merge deduplicating by product id
      setProducts((prev) => {
        const seen = new Set(prev.map((x) => x.id))
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
    } catch (err) {
      console.error('Error loading products:', err)
      setError('No se pudieron cargar los productos. Intenta de nuevo.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, products.length])

  useEffect(() => {
    // Primer lote
    loadMore()
  }, [])

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => {
        console.error('Error loading categories:', err)
      })
  }, [])

  useEffect(() => {
    // IntersectionObserver para scroll infinito
    const el = loadMoreRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && !loadingMore && hasMore) {
        void loadMore()
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore, loadingMore, hasMore])

  return (
    <div>
      <section className="border-b border-border bg-black">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden border-b border-neutral-800">
          <div className="relative h-[44vh] min-h-[260px] w-full sm:h-[52vh] md:h-[58vh]">
            <video
              className="h-full w-full scale-110 object-cover object-center"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/logo.png"
            >
              <source src="/lamborghini-hero.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/80" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/35" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
              <img
                src="/logo.png"
                alt="Coreautotech"
                className="h-32 w-32 drop-shadow-[0_12px_35px_rgba(0,0,0,0.6)] sm:h-44 sm:w-44 md:h-56 md:w-56"
                onError={(e) => ((e.currentTarget.style.display = 'none'))}
              />
              <p className="max-w-3xl px-2 text-base font-semibold tracking-wide text-white sm:text-xl md:text-2xl">LIDER en repuestos y accesorios tuning — calidad y estilo.</p>
            </div>
          </div>
        </div>

        <div className="container py-8 md:py-10">
          <div className="mt-8">
            <div className="mb-4 text-left">
              <h2 className="text-lg font-semibold text-white">Categorias destacadas</h2>
              <p className="text-sm text-neutral-400">Elegi una categoria para empezar a ver productos</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {mainCategories.map((c) => (
                <a
                  key={c.name}
                  href={c.href}
                  className="group rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 transition-all hover:-translate-y-0.5 hover:border-neutral-500 hover:bg-neutral-900"
                >
                  <div className="text-base font-semibold text-white">{c.name}</div>
                  <div className="mt-1 text-xs text-neutral-400">{c.description}</div>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
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
