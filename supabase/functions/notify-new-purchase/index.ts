import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

const OWNER_EMAILS = ['conrastef@gmail.com', 'renzobautista05@gmail.com']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface NotifyPayload {
  purchaseId?: number
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Not Found', { status: 404, headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as NotifyPayload
    const purchaseId = Number(payload.purchaseId)

    if (!purchaseId) {
      return new Response(JSON.stringify({ error: 'purchaseId es requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: compra, error: compraError } = await supabase
      .from('compras')
      .select('*')
      .eq('id', purchaseId)
      .single()

    if (compraError || !compra) {
      return new Response(JSON.stringify({ error: 'Compra no encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: producto } = await supabase
      .from('productos')
      .select('nombre')
      .eq('id', compra.producto_id)
      .single()

    const productName = producto?.nombre || 'Producto sin nombre'

    const html = `
      <h2>Nueva compra recibida</h2>
      <p>Se registró una nueva compra en CoreAutoTech.</p>
      <ul>
        <li><strong>ID compra:</strong> #${compra.id}</li>
        <li><strong>Producto:</strong> ${productName}</li>
        <li><strong>Cantidad:</strong> ${compra.cantidad}</li>
        <li><strong>Monto total:</strong> $${Number(compra.monto_total).toFixed(2)}</li>
        <li><strong>Nombre comprador:</strong> ${compra.nombre_comprador}</li>
        <li><strong>Email comprador:</strong> ${compra.email_comprador}</li>
        <li><strong>Teléfono comprador:</strong> ${compra.telefono_comprador || '-'}</li>
        <li><strong>Notas:</strong> ${compra.notas || '-'}</li>
        <li><strong>Fecha:</strong> ${new Date(compra.creado_en).toLocaleString('es-AR')}</li>
      </ul>
      <p>Revisar en panel de admin.</p>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'CoreAutoTech <noreply@coreautotech.ar>',
        to: OWNER_EMAILS,
        subject: `Nueva compra #${compra.id} - ${productName}`,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const txt = await resendResponse.text()
      throw new Error(`Resend error: ${txt}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
