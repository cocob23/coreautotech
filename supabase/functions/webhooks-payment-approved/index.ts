/**
 * Supabase Edge Function: webhooks/payment-approved
 * 
 * Se ejecuta cuando un comprobante es aprobado
 * Envía email al comprador confirmando la compra y preparando el despacho
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
    estado: string
    url_archivo: string
  }
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Not Found', { status: 404 })
  }

  try {
    const payload: WebhookPayload = await req.json()

    if (payload.type !== 'UPDATE' || !payload.record?.compra_id || payload.record.estado !== 'aprobado') {
      return new Response('Invalid payload', { status: 400 })
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
      .select('nombre, descripcion')
      .eq('id', compra.producto_id)
      .single()

    if (productoError || !producto) {
      return new Response('Producto no encontrado', { status: 404 })
    }

    const html = `
      <h2>Pago aprobado</h2>
      <p>Hola ${compra.nombre_comprador},</p>
      <p>Tu pago fue verificado y aprobado exitosamente.</p>
      <ul>
        <li><strong>Producto:</strong> ${producto.nombre}</li>
        <li><strong>Cantidad:</strong> ${compra.cantidad}</li>
        <li><strong>Total:</strong> $${Number(compra.monto_total).toFixed(2)}</li>
        <li><strong>Compra:</strong> #${compra.id}</li>
      </ul>
      <p>Te avisaremos cuando esté listo para retirar o enviar.</p>
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
        subject: 'Pago aprobado - Tu compra ha sido confirmada',
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
