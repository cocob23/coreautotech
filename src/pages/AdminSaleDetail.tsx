import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, Check, ChevronLeft, Loader, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Textarea'
import { Price } from '../components/ui/Price'
import {
  approvePaymentProof,
  approvePurchaseWithoutProof,
  getAllSalesForAdmin,
  markProductReadyForPickup,
  rejectPaymentProof,
  type AdminSaleRow,
} from '../lib/purchaseAPI'
import { DEPOSITO_CONFIG } from '../lib/config'
import { isPickupByNotes, parseShippingInfoFromNotes } from '../utils/purchaseFlow'

function useAdminAllowed() {
  const [allowed, setAllowed] = useState(false)
  const [checking, setChecking] = useState(true)
  const ADMIN = import.meta.env.VITE_ADMIN_KEY || ''

  useEffect(() => {
    const stored = localStorage.getItem('adminKey')
    setAllowed(Boolean(stored && ADMIN && stored === ADMIN))
    setChecking(false)
  }, [ADMIN])

  return { allowed, checking }
}

export default function AdminSaleDetailPage() {
  const { allowed, checking } = useAdminAllowed()
  const navigate = useNavigate()
  const params = useParams()
  const saleId = Number(params.id)

  const [sale, setSale] = useState<AdminSaleRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  const isPickup = useMemo(() => (sale ? isPickupByNotes(sale.compra.notas) : false), [sale])
  const shippingInfo = useMemo(() => parseShippingInfoFromNotes(sale?.compra.notas), [sale?.compra.notas])
  const canApprove = useMemo(() => {
    if (!sale) return false
    if (sale.comprobante?.estado === 'pendiente') return true
    return sale.compra.estado === 'pago_pendiente' || sale.compra.estado === 'pago_recibido'
  }, [sale])
  const canMarkReadyForPickup = useMemo(
    () => Boolean(sale && isPickupByNotes(sale.compra.notas) && sale.compra.estado === 'preparando_retiro'),
    [sale]
  )

  useEffect(() => {
    if (!Number.isFinite(saleId) || saleId <= 0) {
      setError('Venta inválida')
      setLoading(false)
      return
    }
    void loadSale(saleId)
  }, [saleId])

  const loadSale = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      const rows = await getAllSalesForAdmin()
      const match = rows.find((row) => row.compra.id === id) || null
      if (!match) {
        setSale(null)
        setError('No encontramos esa venta')
        return
      }
      setSale(match)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la venta')
    } finally {
      setLoading(false)
    }
  }

  const onApprove = async () => {
    if (!sale) return
    try {
      setProcessing(true)
      if (sale.comprobante) {
        await approvePaymentProof(sale.comprobante.id, adminNotes)
      } else {
        await approvePurchaseWithoutProof(sale.compra.id, adminNotes)
      }
      setAction(null)
      setAdminNotes('')
      setSuccess('Pago aprobado exitosamente')
      await loadSale(sale.compra.id)
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar pago')
    } finally {
      setProcessing(false)
    }
  }

  const onReject = async () => {
    if (!sale?.comprobante) {
      setError('No hay comprobante para rechazar')
      return
    }
    if (!adminNotes.trim()) {
      setError('Debes ingresar un motivo para rechazar')
      return
    }

    try {
      setProcessing(true)
      await rejectPaymentProof(sale.comprobante.id, adminNotes)
      setAction(null)
      setAdminNotes('')
      setSuccess('Comprobante rechazado')
      await loadSale(sale.compra.id)
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar comprobante')
    } finally {
      setProcessing(false)
    }
  }

  const onMarkReadyForPickup = async () => {
    if (!sale) return
    try {
      setProcessing(true)
      await markProductReadyForPickup(sale.compra.id, `Retiro en depósito: ${DEPOSITO_CONFIG.direccion}`)
      setSuccess(`Compra #${sale.compra.id} marcada como lista para retirar`)
      await loadSale(sale.compra.id)
      setTimeout(() => setSuccess(null), 4000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como listo para retirar')
    } finally {
      setProcessing(false)
    }
  }

  if (checking) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 py-16">
          <Loader className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      </div>
    )
  }

  if (!allowed) return <Navigate to="/admin" replace />

  return (
    <div className="container py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Detalle de venta</h1>
          <p className="text-sm text-neutral-400">Todo el flujo de revisión en una sola pantalla.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/admin')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Volver a ventas
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 py-16">
          <Loader className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-700/40 bg-red-950/30 p-4">
          <p className="flex items-center gap-2 text-red-100">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
          <div className="mt-4">
            <Link to="/admin" className="text-sm font-semibold text-red-200 underline">
              Volver al panel
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && sale && (
        <div className="space-y-4">
          {success && (
            <div className="rounded-lg border border-green-700/40 bg-green-950/30 p-4">
              <p className="flex items-center gap-2 text-green-100">
                <Check className="h-4 w-4" />
                {success}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
            <div className="mb-4 grid grid-cols-1 gap-3 text-sm text-neutral-300 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-neutral-400">Compra</p>
                <p className="font-semibold text-neutral-100">#{sale.compra.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-400">Fecha</p>
                <p className="font-semibold text-neutral-100">
                  {new Date(sale.compra.creado_en).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-400">Cliente</p>
                <p className="font-semibold text-neutral-100">{sale.compra.nombre_comprador}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-400">Email</p>
                <p className="font-semibold text-neutral-100">{sale.compra.email_comprador}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-400">Producto</p>
                <p className="font-semibold text-neutral-100">{sale.nombre_producto}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-400">Monto</p>
                <Price amount={sale.compra.monto_total} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" />
              </div>
            </div>

            {shippingInfo.method === 'envio' && (
              <div className="mb-4 rounded-lg border border-blue-700/40 bg-blue-950/20 p-4 text-sm text-blue-100">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-200">Datos de envío</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <p><span className="font-semibold">Zona:</span> {shippingInfo.zone || '-'}</p>
                  <p><span className="font-semibold">Dirección:</span> {shippingInfo.address || '-'}</p>
                  <p><span className="font-semibold">Localidad:</span> {shippingInfo.locality || '-'}</p>
                  <p><span className="font-semibold">Provincia:</span> {shippingInfo.province || '-'}</p>
                  <p><span className="font-semibold">Código postal:</span> {shippingInfo.postalCode || '-'}</p>
                  <p><span className="font-semibold">Referencia:</span> {shippingInfo.reference || '-'}</p>
                </div>
              </div>
            )}

            {sale.comprobante ? (
              <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3">
                {sale.comprobante.nombre_archivo?.toLowerCase().endsWith('.pdf') ? (
                  <div className="flex min-h-56 items-center justify-center p-4 sm:min-h-72">
                    <div className="text-center">
                      <p className="text-sm text-neutral-300">Documento PDF</p>
                      <a
                        href={sale.comprobante.url_archivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Abrir en nueva ventana →
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto flex w-[220px] flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewImageUrl(sale.comprobante!.url_archivo)}
                      className="flex h-[390px] w-full cursor-zoom-in flex-col overflow-hidden rounded-md border border-neutral-300 bg-white p-1.5 shadow-sm transition-transform hover:scale-[1.01]"
                      title="Abrir imagen completa"
                    >
                      <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-neutral-500">
                        <span>Comprobante</span>
                        <span>Toque para ampliar</span>
                      </div>
                      <div className="flex w-full flex-1 items-center justify-center overflow-hidden bg-white">
                        <img src={sale.comprobante.url_archivo} alt="Comprobante de pago" className="h-full w-full object-contain" />
                      </div>
                    </button>
                    <Button type="button" variant="secondary" onClick={() => setPreviewImageUrl(sale.comprobante!.url_archivo)} className="w-full">
                      Ver completa
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-4 text-sm text-amber-100">
                Esta venta no tiene comprobante cargado. Puedes aprobar manualmente el pago si ya lo verificaste por otro canal.
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {canApprove && (
                <Button
                  onClick={() => {
                    setAction('approve')
                    setAdminNotes('')
                    setError(null)
                  }}
                  className="sm:w-auto"
                >
                  Aprobar
                </Button>
              )}

              {canApprove && sale.comprobante && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAction('reject')
                    setAdminNotes('')
                    setError(null)
                  }}
                  className="border-red-200 text-red-700 hover:bg-red-50 sm:w-auto"
                >
                  Rechazar
                </Button>
              )}

              {canMarkReadyForPickup && (
                <Button
                  onClick={() => {
                    void onMarkReadyForPickup()
                  }}
                  disabled={processing}
                  className="bg-green-600 text-white hover:bg-green-500 sm:w-auto"
                >
                  {processing ? 'Procesando...' : 'Marcar listo para retirar'}
                </Button>
              )}

              {!canApprove && !canMarkReadyForPickup && (
                <p className="text-sm text-neutral-400">
                  Estado actual: {sale.compra.estado}{isPickup ? ` · ${DEPOSITO_CONFIG.label}` : ''}
                </p>
              )}
            </div>
          </div>

          {action && (
            <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              <label className="mb-2 block text-sm font-semibold">
                {action === 'approve' ? 'Notas (opcional)' : 'Motivo del rechazo (obligatorio)'}
              </label>
              <Textarea
                placeholder={
                  action === 'approve'
                    ? 'Agregar notas sobre la validación...'
                    : 'Ingresa el motivo por el cual se rechaza el comprobante...'
                }
                value={adminNotes}
                onChange={(e) => {
                  setAdminNotes(e.target.value)
                  setError(null)
                }}
                className="min-h-24 border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-400"
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAction(null)
                    setAdminNotes('')
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={action === 'approve' ? onApprove : onReject}
                  disabled={processing || (action === 'reject' && !adminNotes.trim())}
                  className={action === 'reject' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
                >
                  {processing ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : action === 'approve' ? (
                    'Confirmar Aprobación'
                  ) : (
                    'Confirmar Rechazo'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImageUrl(null)}
            className="absolute right-4 top-4 rounded-md border border-neutral-600 bg-neutral-900 px-3 py-1 text-sm text-white hover:bg-neutral-800"
          >
            Cerrar
          </button>
          <div className="flex h-[min(90vh,640px)] w-[280px] items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-2xl">
            <img
              src={previewImageUrl}
              alt="Comprobante ampliado"
              className="h-full w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}