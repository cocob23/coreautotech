import { useState, useEffect } from 'react'
import { AlertCircle, Check, Loader, Package, Truck } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog'
import { Price } from './ui/Price'
import { getAllPurchases, createShipment, getShipmentByPurchase, updateShipmentTracking, markProductReadyForPickup } from '../lib/purchaseAPI'
import { DEPOSITO_CONFIG } from '../lib/config'
import type { Purchase, Shipment } from '../lib/types'
import { isPickupByNotes } from '../utils/purchaseFlow'

interface PurchaseWithShipment extends Purchase {
  shipment?: Shipment | null
}

type ShippingCompany = 'andreani' | 'oca' | 'coordinadora' | 'correo_argentino'

const SHIPPING_COMPANIES: { value: ShippingCompany; label: string }[] = [
  { value: 'andreani', label: 'Andreani' },
  { value: 'oca', label: 'OCA' },
  { value: 'coordinadora', label: 'Coordinadora' },
  { value: 'correo_argentino', label: 'Correo Argentino' },
]

export default function ShipmentsAdmin() {
  const [purchases, setPurchases] = useState<PurchaseWithShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithShipment | null>(null)
  const [shipping, setShipping] = useState<{
    company: ShippingCompany
    trackingNumber: string
    estimatedDelivery: string
  }>({
    company: 'andreani',
    trackingNumber: '',
    estimatedDelivery: '',
  })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [action, setAction] = useState<'ready' | 'shipment' | null>(null)

  useEffect(() => {
    loadPurchases()
    // Refresh every 30 seconds
    const interval = setInterval(loadPurchases, 30000)
    return () => clearInterval(interval)
  }, [])

  const isPickupPurchase = (purchase: Purchase) => isPickupByNotes(purchase.notas)

  const loadPurchases = async () => {
    try {
      setLoading(true)
      const allPurchases = await getAllPurchases()
      
      // Filter relevant purchases and load shipment data
      const purchasesWithShipments = await Promise.all(
        allPurchases
          .filter(
            (p) =>
              p.estado === 'aprobado' ||
              p.estado === 'por_enviar' ||
              p.estado === 'preparando_retiro' ||
              p.estado === 'listo_para_retirar' ||
              p.estado === 'enviado' ||
              p.estado === 'entregado'
          )
          .map(async (purchase) => ({
            ...purchase,
            shipment: await getShipmentByPurchase(purchase.id),
          }))
      )
      
      setPurchases(purchasesWithShipments)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar compras')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReady = async () => {
    if (!selectedPurchase) return

    try {
      setProcessing(true)
      await markProductReadyForPickup(selectedPurchase.id)
      setSuccess('Producto marcado como listo para retirar')
      setSelectedPurchase(null)
      setAction(null)
      await loadPurchases()

      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como listo')
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateShipment = async () => {
    if (!selectedPurchase || !shipping.trackingNumber.trim()) {
      setError('Ingresa un número de seguimiento válido')
      return
    }

    try {
      setProcessing(true)

      if (selectedPurchase.shipment) {
        // If shipment exists, just add/update tracking info.
        await updateShipmentTracking(
          selectedPurchase.shipment.id,
          shipping.trackingNumber,
          shipping.estimatedDelivery
        )
      } else {
        // Create shipment and then set tracking data.
        const newShipment = await createShipment(
          selectedPurchase.id,
          shipping.company,
          shipping.trackingNumber,
          shipping.estimatedDelivery
        )

        await updateShipmentTracking(
          newShipment.id,
          shipping.trackingNumber,
          shipping.estimatedDelivery
        )
      }
      
      setSuccess('Envío creado y número de seguimiento registrado')
      setSelectedPurchase(null)
      setAction(null)
      setShipping({
        company: 'andreani',
        trackingNumber: '',
        estimatedDelivery: '',
      })
      await loadPurchases()

      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear envío')
    } finally {
      setProcessing(false)
    }
  }

  if (loading && purchases.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  const readyForShipment = purchases.filter(
    (p) =>
      !isPickupPurchase(p) &&
      p.estado === 'por_enviar' &&
      (!p.shipment || !p.shipment.numero_tracking)
  )
  const preparingForPickup = purchases.filter(
    (p) => isPickupPurchase(p) && (p.estado === 'preparando_retiro' || p.estado === 'aprobado')
  )
  const activeShipments = purchases.filter(
    (p) => p.shipment && !!p.shipment.numero_tracking && p.shipment.estado !== 'entregado'
  )

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-900 flex items-center gap-2">
            <Check className="h-4 w-4" />
            {success}
          </p>
        </div>
      )}

      {/* Ready for Shipment */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Productos listos para despachar ({readyForShipment.length})
        </h3>
        
        {readyForShipment.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-900">No hay productos listos para despachar</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {readyForShipment.map((purchase) => (
              <div
                key={purchase.id}
                className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{purchase.nombre_comprador}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Listo para despacho
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">{purchase.email_comprador}</p>
                    <p className="text-sm text-neutral-600">
                      Cantidad: <strong>{purchase.cantidad}</strong> | Monto: <strong><Price amount={purchase.monto_total} className="font-semibold text-neutral-900" integerClassName="text-sm" centsClassName="text-[0.55em]" /></strong>
                    </p>
                  </div>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setSelectedPurchase(purchase)
                      setAction('shipment')
                      setError(null)
                    }}
                  >
                    Cargar envío
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preparing for Pickup */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Preparando para retiro ({preparingForPickup.length})
        </h3>

        {preparingForPickup.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-900">No hay productos en preparación para retiro</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {preparingForPickup.map((purchase) => (
              <div
                key={purchase.id}
                className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{purchase.nombre_comprador}</h4>
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        Preparando producto
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">{purchase.email_comprador}</p>
                    <p className="text-sm text-neutral-600">
                      Cantidad: <strong>{purchase.cantidad}</strong> | Monto:{' '}
                      <strong><Price amount={purchase.monto_total} className="font-semibold text-neutral-900" integerClassName="text-sm" centsClassName="text-[0.55em]" /></strong>
                    </p>
                  </div>
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setSelectedPurchase(purchase)
                      setAction('ready')
                      setError(null)
                    }}
                  >
                    Marcar listo para retirar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Shipments */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Envíos activos ({activeShipments.length})
        </h3>
        
        {activeShipments.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-900">No hay envíos activos</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeShipments.map((purchase) => {
              const shipment = purchase.shipment!
              return (
                <div
                  key={purchase.id}
                  className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{purchase.nombre_comprador}</h4>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          {shipment.estado === 'listo_para_retirar'
                            ? 'Listo para retirar'
                            : shipment.estado === 'pendiente'
                              ? 'Pendiente'
                              : 'En tránsito'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-1">{purchase.email_comprador}</p>
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-neutral-500 uppercase text-xs">Empresa</p>
                      <p className="font-semibold">{shipment.empresa_envio}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 uppercase text-xs">Número de seguimiento</p>
                      <p className="font-mono font-semibold">{shipment.numero_tracking || '-'}</p>
                    </div>
                  </div>

                  {shipment.fecha_entrega_estimada && (
                    <div className="text-sm text-neutral-600 mb-3">
                      Entrega estimada:{' '}
                      <strong>
                        {new Date(shipment.fecha_entrega_estimada).toLocaleDateString('es-AR')}
                      </strong>
                    </div>
                  )}

                  {shipment.estado === 'listo_para_retirar' && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-900 mb-3">
                      Producto listo para retirar
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialog for Creating/Updating Shipment */}
      <Dialog open={action === 'shipment' && selectedPurchase !== null} 
              onOpenChange={(open) => !open && (setSelectedPurchase(null), setAction(null))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <h2 className="text-xl font-bold">Cargar información de envío</h2>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-lg p-4 text-sm">
                <p className="text-neutral-600 mb-1">Cliente: <strong>{selectedPurchase.nombre_comprador}</strong></p>
                <p className="text-neutral-600">Email: <strong>{selectedPurchase.email_comprador}</strong></p>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Empresa transportista</label>
                <select
                  value={shipping.company}
                  onChange={(e) =>
                    setShipping({ ...shipping, company: e.target.value as ShippingCompany })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                >
                  {SHIPPING_COMPANIES.map((company) => (
                    <option key={company.value} value={company.value}>
                      {company.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Número de seguimiento</label>
                <Input
                  type="text"
                  placeholder="Ej: 123456789ABC"
                  value={shipping.trackingNumber}
                  onChange={(e) =>
                    setShipping({ ...shipping, trackingNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">
                  Fecha estimada de entrega (opcional)
                </label>
                <Input
                  type="date"
                  value={shipping.estimatedDelivery}
                  onChange={(e) =>
                    setShipping({ ...shipping, estimatedDelivery: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedPurchase(null)
                    setAction(null)
                  }}
                  disabled={processing}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateShipment}
                  disabled={processing || !shipping.trackingNumber.trim()}
                >
                  {processing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Guardar envío'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog for Ready for Pickup */}
      <Dialog
        open={action === 'ready' && selectedPurchase !== null}
        onOpenChange={(open) => !open && (setSelectedPurchase(null), setAction(null))}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <h2 className="text-xl font-bold">Marcar producto listo para retirar</h2>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-lg p-4 text-sm">
                <p className="text-neutral-600 mb-1">
                  Cliente: <strong>{selectedPurchase.nombre_comprador}</strong>
                </p>
                <p className="text-neutral-600">
                  Email: <strong>{selectedPurchase.email_comprador}</strong>
                </p>
              </div>

              <p className="text-sm text-neutral-700">
                Esta acción enviará un email avisando que el producto ya está listo para retirar.
              </p>

              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedPurchase(null)
                    setAction(null)
                  }}
                  disabled={processing}
                >
                  Cancelar
                </Button>
                <Button onClick={handleMarkReady} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
