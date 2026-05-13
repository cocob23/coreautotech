import { useEffect, useState } from 'react'
import { AlertCircle, Check, Eye, Loader, ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Price } from './ui/Price'
import { Button } from './ui/Button'
import { getAllSalesForAdmin, markProductReadyForPickup, type AdminSaleRow } from '../lib/purchaseAPI'
import { DEPOSITO_CONFIG } from '../lib/config'
import { isPickupByNotes, parseShippingInfoFromNotes } from '../utils/purchaseFlow'

export default function SalesProofsAdmin() {
  const [sales, setSales] = useState<AdminSaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
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

  const canMarkReadyForPickup = (sale: AdminSaleRow) =>
    isPickupByNotes(sale.compra.notas) && sale.compra.estado === 'preparando_retiro'

  const handleMarkReadyForPickup = async (sale: AdminSaleRow) => {
    try {
      setProcessingId(sale.compra.id)
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
      setProcessingId(null)
    }
  }

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
          {sales.map((sale) => {
            const shippingInfo = parseShippingInfoFromNotes(sale.compra.notas)
            const shortAddress = [shippingInfo.address, shippingInfo.locality, shippingInfo.province].filter(Boolean).join(', ')

            return (
            <div key={sale.compra.id} className="rounded-lg border border-neutral-700 bg-neutral-900 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <Link to={`/admin/ventas/${sale.compra.id}`} className="block flex-1 min-w-0 rounded-md p-1 transition-colors hover:bg-neutral-800/70">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{sale.compra.nombre_comprador}</h3>
                    <span className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-200">{statusLabel(sale)}</span>
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
                      <Price amount={sale.compra.monto_total} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" />
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

                  {shippingInfo.method === 'envio' && (
                    <div className="mt-3 rounded border border-blue-700/40 bg-blue-950/20 p-2 text-xs text-blue-100">
                      <p><span className="font-semibold">Envío:</span> {shippingInfo.zone || 'Zona no especificada'}</p>
                      <p><span className="font-semibold">Dirección:</span> {shortAddress || '-'}</p>
                    </div>
                  )}

                  <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-300">
                    <Eye className="h-4 w-4" />
                    Abrir detalle de venta
                  </p>
                </Link>

                {canMarkReadyForPickup(sale) && (
                  <Button
                    onClick={() => {
                      void handleMarkReadyForPickup(sale)
                    }}
                    disabled={processingId === sale.compra.id}
                    className="w-full whitespace-nowrap bg-green-600 text-white hover:bg-green-500 lg:w-auto"
                  >
                    {processingId === sale.compra.id ? 'Procesando...' : 'Marcar listo para retirar'}
                  </Button>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  )
}