import { useState, useEffect } from 'react'
import { Package, Truck, MapPin, Calendar, AlertCircle, Loader } from 'lucide-react'
import type { Shipment, Purchase } from '../lib/types'
import { getShipmentByPurchase } from '../lib/purchaseAPI'
import { getTracking, type TrackingInfo, type ShippingCompany } from '../lib/shippingAPI'

interface ShipmentTrackingProps {
  purchase: Purchase
}

export default function ShipmentTracking({ purchase }: ShipmentTrackingProps) {
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [tracking, setTracking] = useState<TrackingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadShipmentData()
    // Refresh tracking every 5 minutes
    const interval = setInterval(loadShipmentData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [purchase.id])

  const loadShipmentData = async () => {
    try {
      setLoading(true)
      const shipmentData = await getShipmentByPurchase(purchase.id)

      if (!shipmentData) {
        setShipment(null)
        setTracking(null)
        return
      }

      setShipment(shipmentData)

      // Get tracking info if we have tracking number
      if (shipmentData.numero_tracking) {
        try {
          const trackingData = await getTracking(
            shipmentData.numero_tracking,
            shipmentData.empresa_envio as ShippingCompany
          )
          setTracking(trackingData)
        } catch (err) {
          console.error('Error fetching tracking:', err)
          // Continue even if tracking info fails
        }
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar seguimiento')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return <Package className="h-5 w-5 text-neutral-400" />
      case 'listo_para_retirar':
        return <MapPin className="h-5 w-5 text-blue-500" />
      case 'enviado':
      case 'en_transito':
        return <Truck className="h-5 w-5 text-orange-500" />
      case 'entregado':
        return <Package className="h-5 w-5 text-green-500" />
      default:
        return <Package className="h-5 w-5 text-neutral-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      listo_para_retirar: 'Listo para retirar',
      enviado: 'Enviado',
      en_transito: 'En tránsito',
      entregado: 'Entregado',
      devuelto: 'Devuelto',
    }
    return labels[status.toLowerCase()] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="bg-yellow-950/30 border border-yellow-700/40 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-300 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-100">Envío no disponible</h3>
            <p className="text-sm text-yellow-200 mt-1">
              {purchase.estado === 'aprobado'
                ? 'Tu pago ha sido aprobado. Tu envío estará disponible pronto.'
                : purchase.estado === 'pago_pendiente'
                  ? 'Carga tu comprobante de pago para que podamos procesar tu envío.'
                  : 'Aún no hay información de envío disponible.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          {getStatusIcon(shipment.estado)}
          <div>
            <h3 className="font-semibold text-lg text-neutral-100">{getStatusLabel(shipment.estado)}</h3>
            <p className="text-sm text-neutral-400">
              {shipment.empresa_envio.charAt(0).toUpperCase() + shipment.empresa_envio.slice(1)}
            </p>
          </div>
        </div>

        {/* Tracking Number */}
        {shipment.numero_tracking && (
          <div className="mb-4 p-3 bg-neutral-950 rounded border border-neutral-800">
            <p className="text-xs text-neutral-400 uppercase tracking-wide">Número de seguimiento</p>
            <p className="font-mono font-semibold text-lg text-neutral-100">{shipment.numero_tracking}</p>
            <a
              href={getTrackingUrl(shipment.empresa_envio, shipment.numero_tracking)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-300 hover:text-blue-200 mt-2 inline-block"
            >
              Seguir en {shipment.empresa_envio.charAt(0).toUpperCase() + shipment.empresa_envio.slice(1)}
              →
            </a>
          </div>
        )}

        {/* Estimated Delivery */}
        {shipment.fecha_entrega_estimada && (
          <div className="flex items-center gap-2 text-sm mb-3">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span className="text-neutral-300">
              Entrega estimada:{' '}
              <strong>{new Date(shipment.fecha_entrega_estimada).toLocaleDateString('es-AR', {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</strong>
            </span>
          </div>
        )}

        {/* Shipped Date */}
        {shipment.enviado_en && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Calendar className="h-4 w-4" />
            <span>
              Enviado el{' '}
              {new Date(shipment.enviado_en).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Tracking Events */}
      {tracking && tracking.events && tracking.events.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4 text-neutral-100">Historial de seguimiento</h3>
          <div className="space-y-4">
            {tracking.events.map((event, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mt-1.5" />
                  {idx < tracking.events.length - 1 && (
                    <div className="w-0.5 h-12 bg-neutral-300 mt-3" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="font-semibold text-sm text-neutral-100">{event.status}</p>
                  <p className="text-sm text-neutral-300">{event.description}</p>
                  {event.location && (
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    {new Date(event.date).toLocaleDateString('es-AR', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadShipmentData}
        className="w-full py-2 px-4 text-sm font-semibold text-neutral-200 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
      >
        Actualizar información
      </button>
    </div>
  )
}

function getTrackingUrl(company: string, trackingNumber: string): string {
  const urls: Record<string, string> = {
    andreani: `https://www.andreani.com/seguimiento?codigo=${trackingNumber}`,
    oca: `https://www.oca.com.ar/seguimiento?codigo=${trackingNumber}`,
    coordinadora: `https://www.coordinadora.com.ar/seguimiento/${trackingNumber}`,
    correo_argentino: `https://www.correoargentino.com.ar/seguimiento/${trackingNumber}`,
  }
  return urls[company.toLowerCase()] || '#'
}
