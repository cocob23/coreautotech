import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Loader } from 'lucide-react'
import { Button } from '../components/ui/Button'
import PurchaseDetailPanel from '../components/PurchaseDetailPanel'
import { getPurchaseById } from '../lib/purchaseAPI'
import type { Purchase } from '../lib/types'

export default function PurchaseDetailPage() {
  const navigate = useNavigate()
  const params = useParams()
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const purchaseId = Number(params.id)

  useEffect(() => {
    if (!Number.isFinite(purchaseId) || purchaseId <= 0) {
      setError('Compra inválida')
      setLoading(false)
      return
    }

    void loadPurchase(purchaseId)
  }, [purchaseId])

  const loadPurchase = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPurchaseById(id)

      if (!data) {
        setPurchase(null)
        setError('No se encontró la compra solicitada')
        return
      }

      setPurchase(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la compra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="container py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Detalle de compra</h1>
              <p className="mt-1 text-sm text-neutral-300">Toda la información en una sola página.</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/my-purchases')}>
              Volver a mis compras
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 py-16">
              <Loader className="h-6 w-6 animate-spin text-neutral-500" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-700/40 bg-red-950/30 p-5 text-red-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-300" />
                <div>
                  <p className="font-semibold">No pudimos abrir la compra</p>
                  <p className="mt-1 text-sm text-red-200">{error}</p>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="secondary" onClick={() => navigate('/my-purchases')}>
                  Volver a mis compras
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && purchase && <PurchaseDetailPanel purchase={purchase} onRefresh={() => void loadPurchase(purchase.id)} />}

          {!loading && !error && !purchase && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-100">
              <p className="font-semibold">La compra no está disponible.</p>
              <p className="mt-1 text-sm text-neutral-400">Puedes volver a la lista y buscarla otra vez.</p>
              <div className="mt-4">
                <Button variant="secondary" onClick={() => navigate('/my-purchases')}>
                  Volver a mis compras
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}