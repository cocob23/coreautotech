/**
 * Supabase Edge Function: webhooks/shipment-tracking-updated
 * 
 * Se ejecuta cuando se actualiza el número de tracking de un envío.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface WebhookPayload {
  type: string
  table: string
  record: {
    id: number
    compra_id: number
    empresa_envio: string
    numero_tracking: string
    fecha_entrega_estimada: string | null
  }
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

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Not Found', { status: 404 })
  }

  try {
    const payload: WebhookPayload = await req.json()

    if (payload.type !== 'UPDATE' || !payload.record?.numero_tracking) {
      return new Response('No tracking number', { status: 400 })
    }

    const compraId = payload.record.compra_id

    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .select('*')
      .eq('id', compraId)
      .single()

    if (compraError || !compra) {
      return new Response(`Compra ${compraId} no encontrada`, { status: 404 })
    }

    const { data: producto, error: productoError } = await supabase
      .from('productos')
      .select('nombre')
      .eq('id', compra.producto_id)
      .single()

    if (productoError || !producto) {
      return new Response('Producto no encontrado', { status: 404 })
    }

    const trackingUrl = getTrackingUrl(payload.record.empresa_envio, payload.record.numero_tracking)
    const entrega = payload.record.fecha_entrega_estimada
      ? new Date(payload.record.fecha_entrega_estimada).toLocaleDateString('es-AR')
      : null

    const html = `
      <h2>Tu paquete está en camino</h2>
      <p>Hola ${compra.nombre_comprador},</p>
      <p>Tu producto <strong>${producto.nombre}</strong> fue despachado.</p>
      <p><strong>Tracking:</strong> ${payload.record.numero_tracking}</p>
      <p><strong>Transportista:</strong> ${payload.record.empresa_envio}</p>
      ${entrega ? `<p><strong>Entrega estimada:</strong> ${entrega}</p>` : ''}
      <p><a href="${trackingUrl}">Seguir envío</a></p>
      <p>Saludos,<br/>CoreAutoTech</p>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'CoreAutoTech <noreply@coreautotech.ar>',
        to: compra.email_comprador,
        subject: `Tu envío fue despachado - Tracking ${payload.record.numero_tracking}`,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const txt = await resendResponse.text()
      throw new Error(`Resend error: ${txt}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
