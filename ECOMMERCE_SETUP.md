# Sistema de E-commerce Avanzado - Documentación

## 📋 Descripción General

Este documento describe el sistema completo de compras, pagos, y seguimiento de envíos implementado en CoreautoTech.

## 🔄 Flujo de Compra

```
1. Cliente compra un producto (pendiente_pago)
   ↓
2. Cliente carga comprobante de pago
   ↓
3. Admin revisa y aprueba comprobante → Email de confirmación
   ↓
4. Admin marca producto como "listo para retirar"
   ↓
5. Admin carga número de tracking
   ↓
6. Cliente recibe email con número de tracking
   ↓
7. Cliente puede seguir el envío en tiempo real
```

## 🗄️ Estructura de Base de Datos

### Tabla: purchases
Almacena todas las compras realizadas.

```sql
- id (bigint, primary key)
- product_id (bigint, fk → products)
- quantity (integer)
- buyer_email (text)
- buyer_name (text)
- buyer_phone (text, nullable)
- total_amount (numeric)
- status (text: pending_payment, payment_received, approved, shipped, delivered, cancelled)
- notes (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Tabla: payment_proofs
Almacena los comprobantes de pago subidos.

```sql
- id (bigint, primary key)
- purchase_id (bigint, fk → purchases)
- file_url (text)
- file_name (text, nullable)
- status (text: pending, approved, rejected)
- admin_notes (text, nullable)
- created_at (timestamptz)
- reviewed_at (timestamptz, nullable)
- reviewed_by (text, nullable)
```

### Tabla: shipments
Información de envíos y seguimiento.

```sql
- id (bigint, primary key)
- purchase_id (bigint, unique, fk → purchases)
- shipping_company (text: andreani, oca, coordinadora, correo_argentino)
- tracking_number (text, nullable)
- estimated_delivery (date, nullable)
- status (text: pending, ready_for_pickup, shipped, in_transit, delivered, returned)
- created_at (timestamptz)
- updated_at (timestamptz)
- shipped_at (timestamptz, nullable)
```

### Tabla: email_notifications
Registro de auditoría de emails enviados.

```sql
- id (bigint, primary key)
- purchase_id (bigint, nullable, fk → purchases)
- recipient_email (text)
- email_type (text: proof_uploaded, payment_approved, ready_for_pickup, shipment_tracking)
- sent_at (timestamptz)
- status (text: sent, failed)
```

## 📧 Configuración de Resend

### 1. Crear cuenta en Resend
- Visita https://resend.com
- Crea una cuenta y obtén la API key
- Agrega tu dominio verificado

### 2. Variables de entorno

Agrega a tu `.env.local`:

```env
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
VITE_ADMIN_EMAIL=admin@coreautotech.com
```

### 3. Prueba de envío de emails

```typescript
import { sendPaymentApprovedEmail } from './src/lib/emailService'

await sendPaymentApprovedEmail(
  'customer@example.com',
  'Juan Pérez',
  'Pantalla CarPlay 10 pulgadas',
  1,
  5000,
  123 // purchase id
)
```

## 🚚 Integración de APIs de Envíos

### Opciones disponibles

#### 1. **Andreani**
URL: https://www.andreani.com/webservices/TrackService.asmx

```typescript
// Parámetros
- CodigoSeguimiento: número de tracking
```

#### 2. **OCA**
URL: https://www.oca.com.ar/seguimiento/api/v1/tracking/{trackingNumber}

```typescript
// Retorna
{
  status: string
  location: string
  estimated_delivery: string
  events: []
}
```

#### 3. **Coordinadora**
URL: https://www.coordinadora.com.ar/api/seguimiento/{trackingNumber}

```typescript
// Retorna
{
  estatus: string
  ubicacion: string
  estimado: string
  eventos: []
}
```

#### 4. **Correo Argentino**
URL: https://www.correoargentino.com.ar/api/seguimiento

```typescript
// POST con body
{
  numero_seguimiento: string
}
```

#### 5. **IODATA** (Recomendado - Multi-carrier tracking)
URL: https://api.iodata.com.ar/v1/tracking

Soporta Andreani, OCA, Coordinadora, Correo Argentino, LaLogistica, etc.

```env
VITE_IODATA_API_KEY=tu-api-key
```

### Configuración de IODATA

```typescript
// Ejemplo de uso
import { getTracking } from './src/lib/shippingAPI'

const tracking = await getTracking('123456789', 'andreani')
// Retorna:
{
  status: 'in_transit',
  currentLocation: 'Centro de distribución',
  estimatedDelivery: '2024-04-15',
  events: [...]
}
```

## 🔌 Webhooks de Supabase (Automatización)

Los webhooks permiten automatizar acciones cuando cambian los datos de las tablas. Aquí te muestro cómo configurarlos:

### 1. Habilitar webhooks en Supabase

1. Ve a Supabase Dashboard
2. Selecciona tu proyecto
3. Ir a Database → Webhooks
4. Crear nuevo webhook

### 2. Webhook: Cuando se aprueba un comprobante

**Evento**: `INSERT` en `payment_proofs` con `status = 'approved'`

**URL Endpoint**: `https://tu-dominio.com/api/webhooks/payment-approved`

**Cuerpo a enviar**:
```json
{
  "type": "INSERT",
  "table": "payment_proofs",
  "record": {
    "id": 1,
    "purchase_id": 123,
    "status": "approved",
    "file_url": "..."
  }
}
```

### 3. Webhook: Cuando se crea un shipment

**Evento**: `INSERT` en `shipments` con `status = 'shipped'`

**URL Endpoint**: `https://tu-dominio.com/api/webhooks/shipment-created`

### 4. Función de borde (Edge Function) para procesar webhooks

Si usas Supabase Edge Functions:

```typescript
// supabase/functions/webhook-payment-approved/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Not Found", { status: 404 })
  }

  try {
    const payload = await req.json()
    
    // Verificar que sea el webhook correcto
    if (payload.type !== "INSERT" || !payload.record?.purchase_id) {
      return new Response("Invalid payload", { status: 400 })
    }

    const purchaseId = payload.record.purchase_id

    // Aquí puedes:
    // 1. Obtener datos de la compra
    // 2. Enviar email de confirmación
    // 3. Actualizar inventario
    // 4. Crear registro en CRM externo
    
    console.log(`Payment approved for purchase ${purchaseId}`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

## 🛠️ Funciones del API

### Compras

```typescript
// Crear compra
import { createPurchase } from './src/lib/purchaseAPI'

const purchase = await createPurchase(
  productId,      // ID del producto
  quantity,       // Cantidad
  buyerEmail,     // Email del comprador
  buyerName,      // Nombre del comprador
  buyerPhone,     // Teléfono (opcional)
  totalAmount     // Monto total
)

// Obtener compras por email
import { getPurchasesByEmail } from './src/lib/purchaseAPI'

const purchases = await getPurchasesByEmail('customer@example.com')

// Obtener todas las compras (admin)
import { getAllPurchases } from './src/lib/purchaseAPI'

const allPurchases = await getAllPurchases()
```

### Comprobantes de Pago

```typescript
// Subir comprobante
import { uploadPaymentProof } from './src/lib/purchaseAPI'

const proof = await uploadPaymentProof(
  purchaseId,     // ID de la compra
  fileUrl,        // URL del archivo (desde Storage)
  fileName        // Nombre del archivo
)

// Obtener comprobantes pendientes (admin)
import { getPendingPaymentProofs } from './src/lib/purchaseAPI'

const pendingProofs = await getPendingPaymentProofs()

// Aprobar comprobante
import { approvePaymentProof } from './src/lib/purchaseAPI'

await approvePaymentProof(
  proofId,        // ID del comprobante
  adminNotes      // Notas del admin (opcional)
)

// Rechazar comprobante
import { rejectPaymentProof } from './src/lib/purchaseAPI'

await rejectPaymentProof(
  proofId,        // ID del comprobante
  reason          // Motivo del rechazo
)
```

### Envíos y Tracking

```typescript
// Crear envío
import { createShipment } from './src/lib/purchaseAPI'

const shipment = await createShipment(
  purchaseId,
  'andreani',
  trackingNumber,
  '2024-04-20'    // fecha estimada
)

// Actualizar tracking
import { updateShipmentTracking } from './src/lib/purchaseAPI'

await updateShipmentTracking(
  shipmentId,
  trackingNumber,
  estimatedDelivery
)

// Obtener seguimiento
import { getTracking } from './src/lib/shippingAPI'

const trackingInfo = await getTracking(trackingNumber, 'andreani')
// Retorna:
{
  status: 'in_transit',
  currentLocation: 'Centro de distribución',
  estimatedDelivery: '2024-04-20',
  events: [
    {
      date: '2024-04-15',
      location: 'Centro de distribución',
      status: 'in_transit',
      description: 'Paquete en tránsito'
    }
  ]
}
```

## 🎨 Componentes React

### PaymentProofUpload
Componente para que los clientes suban sus comprobantes.

```tsx
import PaymentProofUpload from './components/PaymentProofUpload'

<PaymentProofUpload
  purchase={purchase}
  onUploadSuccess={() => console.log('Subido!')}
/>
```

### ShipmentTracking
Componente para que los clientes vean el estado del envío en tiempo real.

```tsx
import ShipmentTracking from './components/ShipmentTracking'

<ShipmentTracking purchase={purchase} />
```

### PaymentProofsAdmin
Panel de admin para revisar comprobantes.

```tsx
import PaymentProofsAdmin from './components/PaymentProofsAdmin'

<PaymentProofsAdmin />
```

### ShipmentsAdmin
Panel de admin para gestionar envíos.

```tsx
import ShipmentsAdmin from './components/ShipmentsAdmin'

<ShipmentsAdmin />
```

## 📋 Estados de Compra

| Estado | Descripción | Acciones disponibles |
|--------|-------------|---------------------|
| `pending_payment` | Esperando comprobante | Subir comprobante |
| `payment_received` | Comprobante recibido, en revisión | - |
| `approved` | Pago aprobado | Crear envío |
| `shipped` | Enviado | Ver seguimiento |
| `delivered` | Entregado | - |
| `cancelled` | Cancelado | - |

## 🔐 Seguridad

### RLS Policies (Row Level Security)

Las políticas están configuradas para permitir:
- Lectura pública de compras
- Inserción de compras desde el público
- Inserción de comprobantes desde el público
- Restricción de escritura en shipments (solo admin)

Para mejorar la seguridad en producción:

```sql
-- Auto-RLS para que los clientes solo vean sus propias compras
ALTER POLICY "purchases_read_public" ON purchases
  USING (buyer_email = current_user_email())

-- OAuth con Supabase Auth
ALTER POLICY "payment_proofs_insert_public" ON payment_proofs
  USING (auth.role() = 'authenticated')
```

## 🚀 Deployments Recomendados

### Backend (Edge Functions)
- **Supabase Edge Functions** - Para webhooks y funciones serverless
- **Vercel** - Para API routes
- **Railway** - Para backend persistente

### Frontend
- **Vercel** - Óptimo para Next.js
- **Netlify** - Buena integración con Supabase
- **GitHub Pages** - Para sitios estáticos

## ✅ Checklist de Configuración

- [ ] Variables de entorno configuradas (.env.local)
- [ ] Resend API key generada y añadida
- [ ] Supabase anon key y URL configuradas
- [ ] Storage bucket creado para comprobantes
- [ ] Schema SQL ejecutado en Supabase
- [ ] RLS policies habilitadas
- [ ] Triggers de `updated_at` creados
- [ ] Dominio verificado en Resend
- [ ] API de envíos configurada (Andreani, OCA, etc.)
- [ ] Webhooks de Supabase configurados (opcional pero recomendado)
- [ ] Tests manuales realizados

## 📞 Soporte

Para problemas o preguntas:
1. Revisa los logs en Supabase Dashboard
2. Verifica las variables de entorno
3. Prueba las funciones del API en la consola del navegador
4. Consulta la documentación de Resend y Supabase
