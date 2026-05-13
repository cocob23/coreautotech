import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, Loader, Package } from 'lucide-react'
import { useSearchParams, Link } from 'react-router-dom'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { getPurchasesByEmail } from '../lib/purchaseAPI'
import { isPickupPurchase, getPurchaseStatusInfo } from '../utils/purchaseDisplay'
import { Price } from '../components/ui/Price'
import { DEPOSITO_CONFIG, PAYMENT_INFO } from '../lib/config'
import type { Purchase } from '../lib/types'

const MY_PURCHASES_STORAGE_KEY = 'coreautotech_my_purchases_v1'

export default function MyPurchasesPage() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [highlightedPurchaseId, setHighlightedPurchaseId] = useState<number | null>(null)
  const [showTransferInfo, setShowTransferInfo] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MY_PURCHASES_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { email?: string; purchases?: Purchase[] }
      if (parsed.email) setEmail(parsed.email)
      if (Array.isArray(parsed.purchases) && parsed.purchases.length > 0) {
        setPurchases(parsed.purchases)
        setSearched(true)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(MY_PURCHASES_STORAGE_KEY, JSON.stringify({ email, purchases }))
    } catch {
      // ignore storage errors
    }
  }, [email, purchases])

  const searchByEmail = async (emailValue: string) => {
    const normalizedEmail = emailValue.trim()
    if (!normalizedEmail) {
      setError('Ingresa tu email')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await getPurchasesByEmail(normalizedEmail)
      setPurchases(data)
      setSearched(true)

      if (data.length === 0) {
        setError('No se encontraron compras con este email')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar compras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const emailFromQuery = searchParams.get('email')
    const highlightId = Number(searchParams.get('highlightPurchaseId') || '')
    const transferInfo = searchParams.get('showTransferInfo') === '1'

    if (emailFromQuery) {
      setEmail(emailFromQuery)
      void searchByEmail(emailFromQuery)
    }

    if (Number.isFinite(highlightId) && highlightId > 0) {
      setHighlightedPurchaseId(highlightId)
    }

    setShowTransferInfo(transferInfo)
  }, [searchParams])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    await searchByEmail(email)
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="container py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Mis Compras</h1>
          <p className="mb-8 text-neutral-300">
            Consulta el estado de tus compras y entra al detalle completo de cada una con un solo click.
          </p>

          {showTransferInfo && (
            <div className="mb-6 rounded-lg border border-green-700/40 bg-green-950/30 p-4">
              <p className="font-semibold text-green-100">Para completar tu compra, transferí a:</p>
              <div className="mt-2 grid gap-1 text-sm text-green-200">
                <p><span className="font-semibold">CVU:</span> {PAYMENT_INFO.cbu}</p>
                <p><span className="font-semibold">ALIAS:</span> {PAYMENT_INFO.alias}</p>
                <p><span className="font-semibold">CUIT:</span> {PAYMENT_INFO.cuit}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSearch} className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm text-neutral-100">
            <label className="mb-3 block text-sm font-semibold text-neutral-100">Ingresa tu email</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="border-neutral-700 bg-neutral-950 text-neutral-100 placeholder:text-neutral-400 focus:border-brand"
              />
              <Button onClick={handleSearch} disabled={loading} className="sm:min-w-32">
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Buscar'
                )}
              </Button>
            </div>
            <p className="mt-3 text-xs text-neutral-400">Usa el mismo email que cargaste al comprar para ver tus pedidos.</p>
          </form>

          {error && (
            <div
              className={`mb-8 flex items-start gap-3 rounded-lg border p-4 ${
                searched && purchases.length === 0
                  ? 'border-yellow-700/40 bg-yellow-950/30'
                  : 'border-red-700/40 bg-red-950/30'
              }`}
            >
              <AlertCircle
                className={`h-5 w-5 flex-shrink-0 ${searched && purchases.length === 0 ? 'text-yellow-300' : 'text-red-300'}`}
              />
              <p className={searched && purchases.length === 0 ? 'text-yellow-100' : 'text-red-100'}>{error}</p>
            </div>
          )}

          {purchases.length > 0 && (
            <div className="space-y-4">
              {purchases.map((purchase) => {
                const statusInfo = getPurchaseStatusInfo(purchase.estado)
                const StatusIcon = statusInfo.icon
                const isPickup = isPickupPurchase(purchase)

                return (
                  <Link
                    key={purchase.id}
                    to={`/my-purchases/${purchase.id}`}
                    className={`block rounded-xl border p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg ${statusInfo.color} ${
                      highlightedPurchaseId === purchase.id ? 'ring-2 ring-green-400/80' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <StatusIcon className="mt-0.5 h-6 w-6 flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold">Compra #{purchase.id}</h3>
                          <p className="text-sm opacity-75">
                            {new Date(purchase.creado_en).toLocaleDateString('es-AR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="mt-2 text-sm opacity-90">
                            {isPickup ? DEPOSITO_CONFIG.label : 'Envío a domicilio'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.badge}`}>
                          {statusInfo.label}
                        </span>
                        <p className="text-sm font-semibold text-neutral-100">
                          <Price amount={purchase.monto_total} className="font-semibold text-neutral-100" integerClassName="text-sm sm:text-base" centsClassName="text-[0.55em]" />
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-current border-opacity-20 pt-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase opacity-75">Cantidad</p>
                        <p className="font-semibold">{purchase.cantidad}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase opacity-75">Detalle</p>
                        <p className="font-medium opacity-90">
                          {purchase.notas?.trim() || 'Tocá la card para abrir el detalle completo de esta compra.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm font-semibold text-green-200">
                      <span>Ver detalle completo</span>
                      <Package className="h-4 w-4" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {searched && purchases.length === 0 && !error && (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-neutral-500" />
              <p className="font-semibold text-neutral-200">No tienes compras registradas</p>
              <p className="mt-1 text-sm text-neutral-400">Puedes realizar una compra directo desde nuestro catálogo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}