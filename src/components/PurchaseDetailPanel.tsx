import { AlertCircle, CheckCircle, Loader, Package } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs'
import { Price } from './ui/Price'
import PaymentProofUpload from './PaymentProofUpload'
import ShipmentTracking from './ShipmentTracking'
import { DEPOSITO_CONFIG } from '../lib/config'
import type { Purchase } from '../lib/types'
import {
  getPurchaseCurrentStepIndex,
  getPurchaseStatusInfo,
  isPickupPurchase,
  pickupPurchaseSteps,
  purchaseSteps,
} from '../utils/purchaseDisplay'

interface PurchaseDetailPanelProps {
  purchase: Purchase
  onRefresh?: () => void
}

export default function PurchaseDetailPanel({ purchase, onRefresh }: PurchaseDetailPanelProps) {
  const statusInfo = getPurchaseStatusInfo(purchase.estado)
  const StatusIcon = statusInfo.icon
  const isPickup = isPickupPurchase(purchase)
  const currentSteps = isPickup ? pickupPurchaseSteps : purchaseSteps
  const currentStepIndex = getPurchaseCurrentStepIndex(purchase.estado, isPickup)

  return (
    <div className={`rounded-xl border p-6 shadow-sm ${statusInfo.color}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <StatusIcon className="h-6 w-6" />
          <div>
            <h2 className="text-lg font-bold">Compra #{purchase.id}</h2>
            <p className="text-sm opacity-75">
              {new Date(purchase.creado_en).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.badge}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="mb-5 rounded-lg border border-current border-opacity-30 bg-neutral-900/70 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide opacity-80">Estado de tu compra</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {currentSteps.map((step, idx) => {
            const done = idx <= currentStepIndex
            return (
              <div key={step.key} className="flex min-w-max items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-current' : 'bg-neutral-700'}`} />
                <span className={`text-xs ${done ? 'font-semibold' : 'opacity-70'}`}>{step.label}</span>
                {idx < currentSteps.length - 1 && (
                  <div className={`h-0.5 w-6 ${done ? 'bg-current' : 'bg-neutral-700'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase opacity-75">Cantidad</p>
          <p className="font-semibold">{purchase.cantidad}</p>
        </div>
        <div>
          <p className="text-xs uppercase opacity-75">Total</p>
          <Price amount={purchase.monto_total} className="font-semibold text-neutral-100" integerClassName="text-sm sm:text-base" centsClassName="text-[0.55em]" />
        </div>
      </div>

      <Tabs defaultValue="payment" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 bg-neutral-950/80 border border-neutral-800">
          <TabsTrigger value="payment" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Comprobante de pago
          </TabsTrigger>
          <TabsTrigger
            value="tracking"
            className={isPickup ? 'text-green-300 data-[state=active]:bg-green-600 data-[state=active]:text-white' : ''}
          >
            {isPickup ? DEPOSITO_CONFIG.label : 'Seguimiento'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="mt-4">
          {purchase.estado === 'pago_pendiente' || purchase.estado === 'pago_recibido' ? (
            <PaymentProofUpload purchase={purchase} onUploadSuccess={onRefresh} />
          ) : (
            <div className="rounded-lg border border-green-700/40 bg-green-950/30 p-4">
              <div className="flex items-center gap-2 text-green-100">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-semibold">Pago registrado</p>
                  <p className="text-sm">
                    {purchase.estado === 'aprobado'
                      ? 'Tu pago ha sido aprobado'
                      : purchase.estado === 'pago_recibido'
                        ? 'Tu pago está siendo revisado'
                        : purchase.estado === 'por_enviar'
                          ? 'Tu compra está aprobada y pendiente de envío'
                          : purchase.estado === 'preparando_retiro'
                            ? 'Estamos preparando tu producto para retiro'
                            : purchase.estado === 'listo_para_retirar'
                              ? 'Tu producto ya está listo para retirar'
                              : 'Tu compra está en proceso'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tracking" className="mt-4">
          {isPickup ? (
            purchase.estado === 'listo_para_retirar' ? (
              <div className="rounded-lg border border-green-700/40 bg-green-950/30 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-300" />
                  <div>
                    <p className="font-semibold text-green-100">Producto listo para retirar</p>
                    <p className="mt-1 text-sm text-green-200">
                      Ya puedes retirarlo por el depósito en {DEPOSITO_CONFIG.direccion}.
                    </p>
                  </div>
                </div>
              </div>
            ) : purchase.estado === 'pago_pendiente' ? (
              <div className="rounded-lg border border-yellow-700/40 bg-yellow-950/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-300" />
                  <div>
                    <p className="font-semibold text-yellow-100">Realiza el pago para continuar con la compra</p>
                    <p className="mt-1 text-sm text-yellow-200">
                      Cuando cargues el comprobante y se apruebe, comenzaremos a preparar tu pedido para retiro en depósito.
                    </p>
                  </div>
                </div>
              </div>
            ) : purchase.estado === 'pago_recibido' ? (
              <div className="rounded-lg border border-blue-700/40 bg-blue-950/30 p-4">
                <div className="flex items-start gap-3">
                  <Loader className="mt-0.5 h-5 w-5 text-blue-300" />
                  <div>
                    <p className="font-semibold text-blue-100">Estamos validando tu pago</p>
                    <p className="mt-1 text-sm text-blue-200">
                      Recibimos tu comprobante. Apenas lo aprobemos, pasará a preparación para retiro en depósito.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-700/40 bg-amber-950/30 p-4">
                <div className="flex items-start gap-3">
                  <Package className="mt-0.5 h-5 w-5 text-amber-300" />
                  <div>
                    <p className="font-semibold text-amber-100">Se está preparando tu producto</p>
                    <p className="mt-1 text-sm text-amber-200">
                      Pedido en preparación. Te avisaremos por email cuando esté listo para retirar en depósito.
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : purchase.estado === 'por_enviar' || purchase.estado === 'enviado' || purchase.estado === 'entregado' ? (
            <ShipmentTracking purchase={purchase} />
          ) : (
            <div className="rounded-lg border border-yellow-700/40 bg-yellow-950/30 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-300" />
                <div>
                  <p className="font-semibold text-yellow-100">Seguimiento no disponible</p>
                  <p className="mt-1 text-sm text-yellow-200">
                    El seguimiento estará disponible una vez tu pago sea aprobado y el producto sea despachado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {purchase.notas && (
        <div className="mt-4 border-t border-current border-opacity-20 pt-4">
          <p className="text-xs uppercase opacity-75">Notas</p>
          <p className="mt-1 text-sm">{purchase.notas}</p>
        </div>
      )}
    </div>
  )
}