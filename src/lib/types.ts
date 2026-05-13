export type Category = {
  id: number
  name: string
  slug: string
}

export type Product = {
  id: number
  name: string
  description: string | null
  price: number
  price_list?: number | null
  price_cash?: number | null
  stock: number
  in_stock: boolean
  category_id: number | null
  created_at: string
  updated_at: string
}

export type ProductImage = {
  id: number
  product_id: number
  url: string
  created_at: string
  order?: number | null
}

export type Order = {
  id: number
  product_id: number | null
  quantity: number
  buyer_name: string | null
  buyer_contact: string | null
  status: string
  notes: string | null
  created_at: string
}

// New purchase system types
export type Purchase = {
  id: number
  producto_id: number
  cantidad: number
  email_comprador: string
  nombre_comprador: string
  telefono_comprador?: string | null
  monto_total: number
  estado:
    | 'pago_pendiente'
    | 'pago_recibido'
    | 'aprobado'
    | 'por_enviar'
    | 'preparando_retiro'
    | 'listo_para_retirar'
    | 'enviado'
    | 'entregado'
    | 'cancelado'
  notas?: string | null
  creado_en: string
  actualizado_en: string
}

export type PaymentProof = {
  id: number
  compra_id: number
  url_archivo: string
  nombre_archivo?: string | null
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  notas_admin?: string | null
  creado_en: string
  revisado_en?: string | null
  revisado_por?: string | null
}

export type Shipment = {
  id: number
  compra_id: number
  empresa_envio: string
  numero_tracking?: string | null
  fecha_entrega_estimada?: string | null
  estado: 'pendiente' | 'listo_para_retirar' | 'enviado' | 'en_transito' | 'entregado' | 'devuelto'
  creado_en: string
  actualizado_en: string
  enviado_en?: string | null
}

export type EmailNotification = {
  id: number
  compra_id?: number | null
  email_destinatario: string
  tipo_email: 'comprobante_subido' | 'pago_aprobado' | 'listo_para_retirar' | 'envio_tracking'
  enviado_en: string
  estado: 'enviado' | 'fallido'
}

// Database row types (Spanish naming from DB)
export type CategoriaRow = {
  id: number
  nombre: string
  slug: string
}

export type ProductoRow = {
  id: number
  nombre: string
  descripcion: string | null
  precio_lista: number | null
  precio_efectivo: number | null
  stock: number
  en_stock: boolean
  categoria_id: number | null
  creado_en: string
  actualizado_en: string
}

export type ImagenRow = {
  id: number
  producto_id: number
  url: string
  creado_en: string
  orden: number | null
}

export type PedidoRow = {
  id: number
  producto_id: number | null
  cantidad: number
  nombre_cliente: string | null
  contacto_cliente: string | null
  estado: string
  notas: string | null
  creado_en: string
}
