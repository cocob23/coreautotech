import { updateShipmentTracking } from './purchaseAPI'

export type ShippingCompany = 'andreani' | 'oca' | 'coordinadora' | 'correo_argentino'

export interface TrackingInfo {
  status: string
  currentLocation?: string
  estimatedDelivery?: string
  lastUpdate?: string
  events: TrackingEvent[]
}

export interface TrackingEvent {
  date: string
  location: string
  status: string
  description: string
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

// ============================================================================
// ANDREANI API
// ============================================================================

async function getAndreaniTracking(trackingNumber: string): Promise<TrackingInfo> {
  try {
    await fetch(
      `https://www.andreani.com/webservices/TrackService.asmx/GetTrackingInfo?CodigoSeguimiento=${encodeURIComponent(trackingNumber)}`
    )

    // Parse XML response (you may need xml2js library for production)
    // For now, returning a mock response structure
    return {
      status: 'in_transit',
      currentLocation: 'En tránsito',
      events: [
        {
          date: new Date().toISOString(),
          location: 'Centro de distribución',
          status: 'in_transit',
          description: 'Paquete en tránsito',
        },
      ],
    }
  } catch (error) {
    console.error('Error getting Andreani tracking:', error)
    throw new Error('No se pudo obtener información de seguimiento de Andreani')
  }
}

// ============================================================================
// OCA API
// ============================================================================

async function getOCATracking(trackingNumber: string): Promise<TrackingInfo> {
  try {
    const data = await fetchJson(`https://www.oca.com.ar/seguimiento/api/v1/tracking/${trackingNumber}`)

    return {
      status: data.status || 'in_transit',
      currentLocation: data.location,
      estimatedDelivery: data.estimated_delivery,
      events: data.events || [],
    }
  } catch (error) {
    console.error('Error getting OCA tracking:', error)
    throw new Error('No se pudo obtener información de seguimiento de OCA')
  }
}

// ============================================================================
// COORDINADORA API
// ============================================================================

async function getCoordinadoraTracking(trackingNumber: string): Promise<TrackingInfo> {
  try {
    const data = await fetchJson(`https://www.coordinadora.com.ar/api/seguimiento/${trackingNumber}`)

    return {
      status: data.estatus || 'in_transit',
      currentLocation: data.ubicacion,
      estimatedDelivery: data.estimado,
      events: data.eventos || [],
    }
  } catch (error) {
    console.error('Error getting Coordinadora tracking:', error)
    throw new Error('No se pudo obtener información de seguimiento de Coordinadora')
  }
}

// ============================================================================
// CORREO ARGENTINO API
// ============================================================================

async function getCorreoArgentinoTracking(trackingNumber: string): Promise<TrackingInfo> {
  try {
    const data = await fetchJson(`https://www.correoargentino.com.ar/api/seguimiento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ numero_seguimiento: trackingNumber }),
    })

    return {
      status: data.estado || 'in_transit',
      currentLocation: data.destino ? data.destino.nombre : undefined,
      estimatedDelivery: data.fecha_entrega_estimada,
      events: data.movimientos || [],
    }
  } catch (error) {
    console.error('Error getting Correo Argentino tracking:', error)
    throw new Error('No se pudo obtener información de seguimiento de Correo Argentino')
  }
}

// ============================================================================
// IODATA TRACKING (Multi-carrier integration)
// ============================================================================

interface IODATATrackingRequest {
  code: string // tracking number
  carrier?: string // carrier code
}

interface IODATATrackingResponse {
  code: string
  status: string
  carrier: string
  location: string
  estimatedDelivery: string
  events: Array<{
    date: string
    location: string
    status: string
    description: string
  }>
}

async function getIODATATracking(trackingNumber: string, carrier?: string): Promise<TrackingInfo> {
  try {
    const apiKey = import.meta.env.VITE_IODATA_API_KEY || ''
    if (!apiKey) {
      throw new Error('IODATA API key not configured')
    }

    const data = (await fetchJson(`https://api.iodata.com.ar/v1/tracking`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: trackingNumber,
        carrier: carrier || undefined,
      }),
    })) as IODATATrackingResponse

    return {
      status: data.status,
      currentLocation: data.location,
      estimatedDelivery: data.estimatedDelivery,
      events: data.events,
    }
  } catch (error) {
    console.error('Error getting IODATA tracking:', error)
    throw new Error('No se pudo obtener información de seguimiento')
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get tracking information for a shipment
 */
export async function getTracking(
  trackingNumber: string,
  company: ShippingCompany
): Promise<TrackingInfo> {
  switch (company.toLowerCase()) {
    case 'andreani':
      return getAndreaniTracking(trackingNumber)
    case 'oca':
      return getOCATracking(trackingNumber)
    case 'coordinadora':
      return getCoordinadoraTracking(trackingNumber)
    case 'correo_argentino':
      return getCorreoArgentinoTracking(trackingNumber)
    default:
      // Use IODATA as fallback (multi-carrier)
      return getIODATATracking(trackingNumber, company)
  }
}

/**
 * Update shipment tracking in database and return fresh tracking info
 */
export async function updateAndGetTracking(
  shipmentId: number,
  trackingNumber: string,
  company: ShippingCompany
): Promise<TrackingInfo> {
  try {
    // Update shipment in database
    await updateShipmentTracking(shipmentId, trackingNumber)

    // Get current tracking info
    return await getTracking(trackingNumber, company)
  } catch (error) {
    console.error('Error updating tracking:', error)
    throw error
  }
}

/**
 * Normalize shipping company names
 */
export function normalizeCompanyName(name: string): ShippingCompany {
  const normalized = name.toLowerCase().trim()
  if (normalized.includes('andreani')) return 'andreani'
  if (normalized.includes('oca')) return 'oca'
  if (normalized.includes('coordinadora')) return 'coordinadora'
  if (normalized.includes('correo') || normalized.includes('argentino')) return 'correo_argentino'
  return normalized as ShippingCompany
}
