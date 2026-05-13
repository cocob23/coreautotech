import { supabase } from './supabaseClient'
import type { Purchase, PaymentProof, Shipment } from './types'
import { DEPOSITO_CONFIG } from './config'
import { isPickupByNotes } from '../utils/purchaseFlow'
import {
  sendPaymentProofUploadedEmail,
  sendPaymentProofAdminNotificationEmail,
  sendPaymentApprovedEmail,
  sendReadyForPickupEmail,
  sendTrackingEmail,
} from './emailService'

// ============================================================================
// PURCHASES
// ============================================================================

export async function createPurchase(
  productId: number,
  quantity: number,
  buyerEmail: string,
  buyerName: string,
  buyerPhone?: string,
  totalAmount?: number,
  notes?: string
): Promise<Purchase> {
  const { data, error } = await supabase
    .from('compras')
    .insert({
      producto_id: productId,
      cantidad: quantity,
      email_comprador: buyerEmail,
      nombre_comprador: buyerName,
      telefono_comprador: buyerPhone || null,
      monto_total: totalAmount || 0,
      estado: 'pago_pendiente',
      notas: notes || null,
    })
    .select()
    .single()

  if (error) throw error

  // Notify both owners about the new purchase (non-blocking, with diagnostics).
  void supabase.functions
    .invoke('notify-new-purchase', {
      body: { purchaseId: (data as Purchase).id },
    })
    .then(({ error: invokeError }) => {
      if (invokeError) {
        console.error('Error notifying owners about new purchase:', invokeError)
      }
    })

  return data as Purchase
}

export async function getPurchaseById(id: number): Promise<Purchase | null> {
  const { data, error } = await supabase
    .from('compras')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as Purchase) || null
}

export async function getPurchasesByEmail(email: string): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('compras')
    .select('*')
    .eq('email_comprador', email)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return (data as Purchase[]) || []
}

export async function getAllPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('compras')
    .select('*')
    .order('creado_en', { ascending: false })

  if (error) throw error
  return (data as Purchase[]) || []
}

export async function updatePurchaseStatus(id: number, status: Purchase['estado']): Promise<Purchase> {
  const { data, error } = await supabase
    .from('compras')
    .update({ estado: status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Purchase
}

// ============================================================================
// PAYMENT PROOFS
// ============================================================================

export async function uploadPaymentProof(
  purchaseId: number,
  fileUrl: string,
  fileName?: string
): Promise<PaymentProof> {
  // Get purchase details to send emails
  const purchase = await getPurchaseById(purchaseId)
  if (!purchase) throw new Error('Purchase not found')

  // Enforce single proof per purchase: one active record only.
  const existingProof = await getCurrentPaymentProofByPurchase(purchaseId)
  if (existingProof) {
    throw new Error('Ya cargaste un comprobante. Elimínalo para subir uno nuevo.')
  }

  // Create payment proof record
  const { data, error } = await supabase
    .from('comprobantes_pago')
    .insert({
      compra_id: purchaseId,
      url_archivo: fileUrl,
      nombre_archivo: fileName || 'comprobante.jpg',
      estado: 'pendiente',
    })
    .select()
    .single()

  if (error) throw error

  await updatePurchaseStatus(purchaseId, 'pago_recibido')

  // Send emails
  const product = await getProductForPurchase(purchase.producto_id)
  if (product) {
    await sendPaymentProofUploadedEmail(
      purchase.email_comprador,
      purchase.nombre_comprador,
      product.nombre,
      purchaseId
    )

    await sendPaymentProofAdminNotificationEmail(
      purchase.email_comprador,
      purchase.nombre_comprador,
      product.nombre,
      purchase.cantidad,
      purchase.monto_total,
      purchaseId,
      fileUrl
    )
  }

  return data as PaymentProof
}

export async function getCurrentPaymentProofByPurchase(purchaseId: number): Promise<PaymentProof | null> {
  const { data, error } = await supabase
    .from('comprobantes_pago')
    .select('*')
    .eq('compra_id', purchaseId)
    .order('creado_en', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return (data as PaymentProof) || null
}

export async function deletePaymentProofByPurchase(purchaseId: number): Promise<void> {
  const current = await getCurrentPaymentProofByPurchase(purchaseId)
  if (!current) return

  // Prevent deleting approved proof in order to keep audit consistency.
  if (current.estado === 'aprobado') {
    throw new Error('No se puede eliminar un comprobante ya aprobado.')
  }

  const { error } = await supabase
    .from('comprobantes_pago')
    .delete()
    .eq('id', current.id)

  if (error) throw error

  await updatePurchaseStatus(purchaseId, 'pago_pendiente')
}

export async function getPaymentProofsByPurchase(purchaseId: number): Promise<PaymentProof[]> {
  const { data, error } = await supabase
    .from('comprobantes_pago')
    .select('*')
    .eq('compra_id', purchaseId)
    .order('creado_en', { ascending: false })

  if (error) throw error
  return (data as PaymentProof[]) || []
}

export async function getPaymentProofById(id: number): Promise<PaymentProof | null> {
  const { data, error } = await supabase
    .from('comprobantes_pago')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as PaymentProof) || null
}

export async function getPendingPaymentProofs(): Promise<(PaymentProof & { compra: Purchase; nombre_producto: string })[]> {
  const { data, error } = await supabase
    .from('comprobantes_pago')
    .select(
      `
      *,
      compra:compra_id(
        id, producto_id, cantidad, email_comprador, nombre_comprador, monto_total, creado_en
      )
    `
    )
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false })

  if (error) throw error

  // Fetch product names
  const results = await Promise.all(
    (data || []).map(async (proof: any) => ({
      ...proof,
      nombre_producto: (await getProductNameById(proof.compra.producto_id)) || 'Sin nombre',
    }))
  )

  return results
}

export type AdminSaleRow = {
  compra: Purchase
  comprobante: PaymentProof | null
  nombre_producto: string
}

export async function getAllSalesForAdmin(): Promise<AdminSaleRow[]> {
  const purchases = await getAllPurchases()

  const rows = await Promise.all(
    purchases.map(async (purchase) => {
      const [proof, productName] = await Promise.all([
        getCurrentPaymentProofByPurchase(purchase.id),
        getProductNameById(purchase.producto_id),
      ])

      return {
        compra: purchase,
        comprobante: proof,
        nombre_producto: productName || 'Sin nombre',
      }
    })
  )

  return rows
}

export async function approvePaymentProof(
  proofId: number,
  adminNotes?: string
): Promise<PaymentProof> {
  const proof = await getPaymentProofById(proofId)
  if (!proof) throw new Error('Payment proof not found')

  // Update proof status
  const { data, error } = await supabase
    .from('comprobantes_pago')
    .update({
      estado: 'aprobado',
      notas_admin: adminNotes || null,
      revisado_en: new Date().toISOString(),
    })
    .eq('id', proofId)
    .select()
    .single()

  if (error) throw error

  // Update purchase status and send approval email
  const purchase = await getPurchaseById(proof.compra_id)
  if (purchase) {
    const isPickup = isPickupByNotes(purchase.notas)
    await updatePurchaseStatus(
      proof.compra_id,
      isPickup ? 'preparando_retiro' : 'por_enviar'
    )

    const product = await getProductForPurchase(purchase.producto_id)
    if (product) {
      await sendPaymentApprovedEmail(
        purchase.email_comprador,
        purchase.nombre_comprador,
        product.nombre,
        purchase.cantidad,
        purchase.monto_total,
        proof.compra_id
      )
    }
  }

  return data as PaymentProof
}

export async function rejectPaymentProof(
  proofId: number,
  adminNotes: string
): Promise<PaymentProof> {
  const { data, error } = await supabase
    .from('comprobantes_pago')
    .update({
      estado: 'rechazado',
      notas_admin: adminNotes,
      revisado_en: new Date().toISOString(),
    })
    .eq('id', proofId)
    .select()
    .single()

  if (error) throw error

  return data as PaymentProof
}

export async function approvePurchaseWithoutProof(
  purchaseId: number,
  adminNotes?: string
): Promise<Purchase> {
  const purchase = await getPurchaseById(purchaseId)
  if (!purchase) throw new Error('Purchase not found')

  if (purchase.estado !== 'pago_pendiente' && purchase.estado !== 'pago_recibido') {
    throw new Error('Esta compra no se puede aprobar manualmente en su estado actual.')
  }

  const isPickup = isPickupByNotes(purchase.notas)
  const nextStatus: Purchase['estado'] = isPickup ? 'preparando_retiro' : 'por_enviar'
  const updatedPurchase = await updatePurchaseStatus(purchaseId, nextStatus)

  const product = await getProductForPurchase(purchase.producto_id)
  if (product) {
    await sendPaymentApprovedEmail(
      purchase.email_comprador,
      purchase.nombre_comprador,
      product.nombre,
      purchase.cantidad,
      purchase.monto_total,
      purchaseId
    )
  }

  if (adminNotes?.trim()) {
    console.info('Aprobación manual sin comprobante', {
      purchaseId,
      adminNotes,
    })
  }

  return updatedPurchase
}

// ============================================================================
// SHIPMENTS
// ============================================================================

export async function createShipment(
  purchaseId: number,
  shippingCompany: string,
  trackingNumber?: string,
  estimatedDelivery?: string
): Promise<Shipment> {
  const { data, error } = await supabase
    .from('envios')
    .insert({
      compra_id: purchaseId,
      empresa_envio: shippingCompany,
      numero_tracking: trackingNumber || null,
      fecha_entrega_estimada: estimatedDelivery || null,
      estado: 'pendiente',
    })
    .select()
    .single()

  if (error) throw error
  return data as Shipment
}

export async function getShipmentByPurchase(purchaseId: number): Promise<Shipment | null> {
  const { data, error } = await supabase
    .from('envios')
    .select('*')
    .eq('compra_id', purchaseId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as Shipment) || null
}

export async function getShipmentById(id: number): Promise<Shipment | null> {
  const { data, error } = await supabase
    .from('envios')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as Shipment) || null
}

export async function updateShipmentStatus(id: number, status: Shipment['estado']): Promise<Shipment> {
  const { data, error } = await supabase
    .from('envios')
    .update({ estado: status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Shipment
}

export async function updateShipmentTracking(
  id: number,
  trackingNumber: string,
  estimatedDelivery?: string
): Promise<Shipment> {
  const { data, error } = await supabase
    .from('envios')
    .update({
      numero_tracking: trackingNumber,
      fecha_entrega_estimada: estimatedDelivery || null,
      estado: 'enviado',
      enviado_en: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Send tracking email to buyer
  const shipment = data as Shipment
  const purchase = await getPurchaseById(shipment.compra_id)
  if (purchase) {
    await updatePurchaseStatus(shipment.compra_id, 'enviado')

    const product = await getProductForPurchase(purchase.producto_id)
    if (product) {
      await sendTrackingEmail(
        purchase.email_comprador,
        purchase.nombre_comprador,
        product.nombre,
        trackingNumber,
        shipment.empresa_envio,
        shipment.compra_id,
        estimatedDelivery
      )
    }
  }

  return data as Shipment
}

export async function markProductReadyForPickup(
  purchaseId: number,
  pickupInstructions?: string
): Promise<Purchase> {
  const purchase = await getPurchaseById(purchaseId)
  if (!purchase) throw new Error('Purchase not found')

  // Ensure shipment exists and mark as ready for pickup
  const shipment = await getShipmentByPurchase(purchaseId)
  if (shipment) {
    await updateShipmentStatus(shipment.id, 'listo_para_retirar')
  } else {
    const created = await createShipment(purchaseId, 'retiro_local')
    await updateShipmentStatus(created.id, 'listo_para_retirar')
  }

  // Update purchase status
  const updatedPurchase = await updatePurchaseStatus(purchaseId, 'listo_para_retirar')

  // Send ready for pickup email
  const product = await getProductForPurchase(purchase.producto_id)
  if (product) {
    await sendReadyForPickupEmail(
      purchase.email_comprador,
      purchase.nombre_comprador,
      product.nombre,
      purchaseId,
      pickupInstructions
    )
  }

  return updatedPurchase
}

// ============================================================================
// HELPERS
// ============================================================================

async function getProductForPurchase(productId: number): Promise<any> {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, descripcion, precio_lista')
    .eq('id', productId)
    .single()

  if (error) return null
  return data
}

async function getProductNameById(productId: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('productos')
    .select('nombre')
    .eq('id', productId)
    .single()

  if (error) return null
  return data?.nombre || null
}
