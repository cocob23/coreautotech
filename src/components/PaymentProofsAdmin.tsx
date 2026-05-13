import { useState, useEffect } from 'react'
import { AlertCircle, Check, X, Loader, Eye, Download, ReceiptText } from 'lucide-react'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { Dialog, DialogContent, DialogHeader } from './ui/Dialog'
import { Price } from './ui/Price'
import {
  getAllSalesForAdmin,
  approvePaymentProof,
  rejectPaymentProof,
  approvePurchaseWithoutProof,
  markProductReadyForPickup,
  type AdminSaleRow,
} from '../lib/purchaseAPI'
import { DEPOSITO_CONFIG } from '../lib/config'
import { isPickupByNotes } from '../utils/purchaseFlow'

export default function PaymentProofsAdmin() {
  const [sales, setSales] = useState<AdminSaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<AdminSaleRow | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    void loadSales()
    const interval = setInterval(() => {
      void loadSales()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSales = async () => {
    try {
      setLoading(true)
      const data = await getAllSalesForAdmin()
      setSales(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  const closeDialog = () => {
    setSelectedSale(null)
    setAdminNotes('')
    setAction(null)
    setPreviewImageUrl(null)
  }

  const handleApprove = async () => {
    if (!selectedSale) return

    try {
      setProcessing(true)
      if (selectedSale.comprobante) {
        await approvePaymentProof(selectedSale.comprobante.id, adminNotes)
      } else {
        await approvePurchaseWithoutProof(selectedSale.compra.id, adminNotes)
      }

      setSuccess('Pago aprobado exitosamente')
      closeDialog()
      await loadSales()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar pago')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedSale?.comprobante) {
      setError('No hay comprobante para rechazar en esta venta')
      return
    }
    if (!adminNotes.trim()) {
      setError('Debes ingresar un motivo para rechazar')
      return
    }

    try {
      setProcessing(true)
      await rejectPaymentProof(selectedSale.comprobante.id, adminNotes)
      setSuccess('Comprobante rechazado')
      closeDialog()
      await loadSales()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar comprobante')
    } finally {
      setProcessing(false)
    }
  }

  const handleMarkReadyForPickup = async (sale: AdminSaleRow) => {
    try {
      setProcessing(true)
      await markProductReadyForPickup(
        sale.compra.id,
        `Retiro en depósito: ${DEPOSITO_CONFIG.direccion}`
      )
      setSuccess(`Compra #${sale.compra.id} marcada como lista para retirar en ${DEPOSITO_CONFIG.direccion}`)
      await loadSales()
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como listo para retirar')
    } finally {
      setProcessing(false)
    }
  }

  const statusLabel = (sale: AdminSaleRow) => {
    const isPickup = isPickupByNotes(sale.compra.notas)
    if (sale.comprobante?.estado === 'pendiente') return 'Comprobante pendiente'
    if (sale.comprobante?.estado === 'aprobado') return 'Comprobante aprobado'
    if (sale.comprobante?.estado === 'rechazado') return 'Comprobante rechazado'
    if (sale.compra.estado === 'pago_pendiente') return 'Sin comprobante'
    if (sale.compra.estado === 'pago_recibido') return 'Pago recibido'
    if (sale.compra.estado === 'preparando_retiro') return 'Pago aprobado - Preparando pedido'
    if (sale.compra.estado === 'listo_para_retirar') return `Listo para retirar en ${DEPOSITO_CONFIG.direccion}`
    if (sale.compra.estado === 'por_enviar') return isPickup ? 'Pago aprobado - Preparando pedido' : 'Pago aprobado'
    return sale.compra.estado
  }

  const canApprove = (sale: AdminSaleRow) => {
    if (sale.comprobante?.estado === 'pendiente') return true
    return sale.compra.estado === 'pago_pendiente' || sale.compra.estado === 'pago_recibido'
  }

  const canMarkReadyForPickup = (sale: AdminSaleRow) =>
    isPickupByNotes(sale.compra.notas) && sale.compra.estado === 'preparando_retiro'

  if (loading && sales.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 text-neutral-100">
      {error && (
        <div className="rounded-lg border border-red-700/40 bg-red-950/30 p-4">
          <p className="flex items-center gap-2 text-red-100">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-700/40 bg-green-950/30 p-4">
          <p className="flex items-center gap-2 text-green-100">
            <Check className="h-4 w-4" />
            {success}
          </p>
        </div>
      )}

      {sales.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6 text-center">
          <ReceiptText className="mx-auto mb-2 h-8 w-8 text-neutral-500" />
          <p className="font-semibold text-neutral-100">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sales.map((sale) => (
            <div
              key={sale.compra.id}
              className="rounded-lg border border-neutral-700 bg-neutral-900 p-4 transition-colors hover:bg-neutral-800"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{sale.compra.nombre_comprador}</h3>
                    <span className="rounded px-2 py-1 text-xs bg-neutral-800 text-neutral-200">
                      {statusLabel(sale)}
                    </span>
                  </div>

                  <div className="mb-3 grid grid-cols-1 gap-3 text-sm text-neutral-300 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-neutral-400">Producto</p>
                      <p className="font-semibold text-neutral-100">{sale.nombre_producto}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-neutral-400">Cantidad</p>
                      <p className="font-semibold text-neutral-100">{sale.compra.cantidad}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-neutral-400">Monto</p>
                      <p className="font-semibold text-neutral-100"><Price amount={sale.compra.monto_total} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" /></p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-neutral-400">Email</p>
                      <p className="font-semibold text-neutral-100">{sale.compra.email_comprador}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <p>ID Compra: #{sale.compra.id}</p>
                    <p>•</p>
                    <p>
                      {new Date(sale.compra.creado_en).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
                  {sale.comprobante && (
                    <>
                      <a
                        href={sale.comprobante.url_archivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 transition-colors hover:bg-neutral-700"
                        title="Ver comprobante"
                      >
                        <Eye className="h-4 w-4 text-neutral-300" />
                      </a>
                      <a
                        href={sale.comprobante.url_archivo}
                        download
                        className="rounded-lg p-2 transition-colors hover:bg-neutral-700"
                        title="Descargar"
                      >
                        <Download className="h-4 w-4 text-neutral-300" />
                      </a>
                    </>
                  )}

                  {canApprove(sale) && (
                    <Button
                      onClick={() => {
                        setSelectedSale(sale)
                        setAction(null)
                        setAdminNotes('')
                      }}
                      className="w-full whitespace-nowrap sm:w-auto"
                    >
                      Revisar
                    </Button>
                  )}

                  {canMarkReadyForPickup(sale) && (
                    <Button
                      onClick={() => {
                        void handleMarkReadyForPickup(sale)
                      }}
                      disabled={processing}
                      className="w-full whitespace-nowrap bg-green-600 text-white hover:bg-green-500 sm:w-auto"
                    >
                      {processing ? 'Procesando...' : 'Marcar listo para retirar'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={selectedSale !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <h2 className="text-xl font-bold">Revisar pago</h2>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              {selectedSale.comprobante ? (
                <div className="rounded-lg border border-neutral-700 bg-neutral-900 p-3">
                  {selectedSale.comprobante.nombre_archivo?.toLowerCase().endsWith('.pdf') ? (
                    <div className="flex min-h-56 items-center justify-center p-4 sm:min-h-72">
                      <div className="text-center">
                        <p className="text-sm text-neutral-300">Documento PDF</p>
                        <a
                          href={selectedSale.comprobante.url_archivo}
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
                        onClick={() => setPreviewImageUrl(selectedSale.comprobante.url_archivo)}
                        className="flex h-[390px] w-full cursor-zoom-in flex-col overflow-hidden rounded-md border border-neutral-300 bg-white p-1.5 shadow-sm transition-transform hover:scale-[1.01]"
                        title="Abrir imagen completa"
                      >
                        <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-neutral-500">
                          <span>Comprobante</span>
                          <span>Toque para ampliar</span>
                        </div>
                        <div className="flex flex-1 w-full items-center justify-center overflow-hidden bg-white">
                          <img
                            src={selectedSale.comprobante.url_archivo}
                            alt="Comprobante de pago"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setPreviewImageUrl(selectedSale.comprobante.url_archivo)}
                        className="w-full"
                      >
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

              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-neutral-400">Cliente</p>
                  <p className="font-semibold">{selectedSale.compra.nombre_comprador}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-neutral-400">Email</p>
                  <p className="font-semibold">{selectedSale.compra.email_comprador}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-neutral-400">Producto</p>
                  <p className="font-semibold">{selectedSale.nombre_producto}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-neutral-400">Monto</p>
                  <p className="font-semibold"><Price amount={selectedSale.compra.monto_total} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" /></p>
                </div>
              </div>

              {!action ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setAction('approve')
                      setAdminNotes('')
                      setError(null)
                    }}
                    className="flex-1"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                  {selectedSale.comprobante && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAction('reject')
                        setAdminNotes('')
                        setError(null)
                      }}
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div>
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
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
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
                      onClick={action === 'approve' ? handleApprove : handleReject}
                      disabled={processing || (action === 'reject' && !adminNotes.trim())}
                      className={action === 'reject' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
                    >
                      {processing ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Procesando...
                        </>
                      ) : action === 'approve' ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Confirmar Aprobación
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Confirmar Rechazo
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
