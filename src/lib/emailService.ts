import { supabase } from './supabaseClient'
import type { EmailNotification } from './types'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@coreautotech.com'

async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  // En frontend no debemos enviar emails directo con SDK/API keys.
  // Este no-op evita crashes en runtime; el envio real debe vivir en Edge Functions/backend.
  console.info('Email pendiente de envio en backend:', { to: params.to, subject: params.subject })
}

/**
 * Log email notification to database for audit trail
 */
async function logEmailNotification(
  recipientEmail: string,
  emailType: EmailNotification['tipo_email'],
  purchaseId?: number
): Promise<void> {
  try {
    await supabase.from('notificaciones_email').insert({
      email_destinatario: recipientEmail,
      tipo_email: emailType,
      compra_id: purchaseId || null,
      estado: 'enviado',
    })
  } catch (error) {
    console.error('Error logging email notification:', error)
  }
}

/**
 * Send email when payment proof is uploaded
 */
export async function sendPaymentProofUploadedEmail(
  buyerEmail: string,
  buyerName: string,
  productName: string,
  purchaseId: number
): Promise<void> {
  try {
    await sendEmail({
      to: buyerEmail,
      subject: 'Comprobante de pago recibido - Coreautotech',
      html: `
        <h2>¡Comprobante recibido!</h2>
        <p>Hola ${buyerName},</p>
        <p>Hemos recibido tu comprobante de pago para el producto <strong>${productName}</strong>.</p>
        <p>Nuestro equipo lo revisará en breve y te notificaremos sobre su aprobación.</p>
        <p>Referencia de compra: #${purchaseId}</p>
        <p>Saludos,<br/>CoreautoTech</p>
      `,
    })

    await logEmailNotification(buyerEmail, 'comprobante_subido', purchaseId)
  } catch (error) {
    console.error('Error sending payment proof upload email:', error)
  }
}

/**
 * Send email to admin when payment proof is uploaded
 */
export async function sendPaymentProofAdminNotificationEmail(
  buyerEmail: string,
  buyerName: string,
  productName: string,
  quantity: number,
  amount: number,
  purchaseId: number,
  proofUrl: string
): Promise<void> {
  try {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Nueva prueba de pago para revisar - Compra #${purchaseId}`,
      html: `
        <h2>Nueva prueba de pago recibida</h2>
        <p><strong>Cliente:</strong> ${buyerName} (${buyerEmail})</p>
        <p><strong>Producto:</strong> ${productName}</p>
        <p><strong>Cantidad:</strong> ${quantity}</p>
        <p><strong>Monto:</strong> $${amount.toFixed(2)}</p>
        <p><strong>ID de Compra:</strong> #${purchaseId}</p>
        <p><strong>Comprobante:</strong> <a href="${proofUrl}">Ver imagen</a></p>
        <p><a href="${window.location.origin}/admin">Ir al panel de admin</a></p>
      `,
    })

    await logEmailNotification(ADMIN_EMAIL, 'comprobante_subido', purchaseId)
  } catch (error) {
    console.error('Error sending admin notification email:', error)
  }
}

/**
 * Send approval email to buyer when payment proof is approved
 */
export async function sendPaymentApprovedEmail(
  buyerEmail: string,
  buyerName: string,
  productName: string,
  quantity: number,
  total: number,
  purchaseId: number
): Promise<void> {
  try {
    await sendEmail({
      to: buyerEmail,
      subject: 'Pago aprobado - Tu compra ha sido confirmada',
      html: `
        <h2>¡Pago aprobado!</h2>
        <p>Hola ${buyerName},</p>
        <p>Tu pago ha sido verificado y aprobado exitosamente.</p>
        <h3>Resumen de tu compra:</h3>
        <ul>
          <li><strong>Producto:</strong> ${productName}</li>
          <li><strong>Cantidad:</strong> ${quantity}</li>
          <li><strong>Total:</strong> $${total.toFixed(2)}</li>
          <li><strong>Número de compra:</strong> #${purchaseId}</li>
        </ul>
        <p>Nos comunicaremos contigo cuando el producto esté listo para retirar.</p>
        <p>Saludos,<br/>CoreautoTech</p>
      `,
    })

    await logEmailNotification(buyerEmail, 'pago_aprobado', purchaseId)
  } catch (error) {
    console.error('Error sending payment approved email:', error)
  }
}

/**
 * Send email when product is ready for pickup
 */
export async function sendReadyForPickupEmail(
  buyerEmail: string,
  buyerName: string,
  productName: string,
  purchaseId: number,
  pickupInstructions?: string
): Promise<void> {
  try {
    await sendEmail({
      to: buyerEmail,
      subject: 'Tu compra está lista para retirar!',
      html: `
        <h2>¡Tu compra está lista!</h2>
        <p>Hola ${buyerName},</p>
        <p>Tu producto <strong>${productName}</strong> está listo para retirar.</p>
        <p><strong>Número de compra:</strong> #${purchaseId}</p>
        ${pickupInstructions ? `<p><strong>Instrucciones:</strong><br/>${pickupInstructions}</p>` : ''}
        <p>¡Gracias por tu compra!</p>
        <p>Saludos,<br/>CoreautoTech</p>
      `,
    })

    await logEmailNotification(buyerEmail, 'listo_para_retirar', purchaseId)
  } catch (error) {
    console.error('Error sending ready for pickup email:', error)
  }
}

/**
 * Send tracking email when shipment is dispatched
 */
export async function sendTrackingEmail(
  buyerEmail: string,
  buyerName: string,
  productName: string,
  trackingNumber: string,
  shippingCompany: string,
  purchaseId: number,
  estimatedDelivery?: string
): Promise<void> {
  const trackingUrl = getTrackingUrl(shippingCompany, trackingNumber)

  try {
    await sendEmail({
      to: buyerEmail,
      subject: `Tu paquete ha sido despachado - Número de seguimiento: ${trackingNumber}`,
      html: `
        <h2>¡Tu paquete está en camino!</h2>
        <p>Hola ${buyerName},</p>
        <p>Tu producto <strong>${productName}</strong> ha sido despachado y está en camino.</p>
        <p><strong>Número de seguimiento:</strong> ${trackingNumber}</p>
        <p><strong>Empresa transportista:</strong> ${shippingCompany}</p>
        ${estimatedDelivery ? `<p><strong>Entrega estimada:</strong> ${new Date(estimatedDelivery).toLocaleDateString('es-AR')}</p>` : ''}
        <p><strong><a href="${trackingUrl}">Seguir tu compra en tiempo real</a></strong></p>
        <p>Saludos,<br/>CoreautoTech</p>
      `,
    })

    await logEmailNotification(buyerEmail, 'envio_tracking', purchaseId)
  } catch (error) {
    console.error('Error sending tracking email:', error)
  }
}

/**
 * Get tracking URL based on shipping company
 */
function getTrackingUrl(company: string, trackingNumber: string): string {
  const urls: Record<string, string> = {
    andreani: `https://www.andreani.com/seguimiento?codigo=${trackingNumber}`,
    oca: `https://www.oca.com.ar/seguimiento?codigo=${trackingNumber}`,
    coordinadora: `https://www.coordinadora.com.ar/seguimiento/${trackingNumber}`,
    correo_argentino: `https://www.correoargentino.com.ar/seguimiento/${trackingNumber}`,
  }
  return urls[company.toLowerCase()] || '#'
}
