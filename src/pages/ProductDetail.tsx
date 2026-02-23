import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProductById, createOrder } from '../lib/api'
import type { Product, ProductImage } from '../lib/types'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter } from '../components/ui/Dialog'
import { Input } from '../components/ui/Input'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<(Product & { images: ProductImage[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const pid = Number(id)
    if (!pid) return
    getProductById(pid).then(setProduct).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    // Reset selected image when product changes
    setCurrentIndex(0)
  }, [product?.id])

  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerContact, setBuyerContact] = useState('')
  const [notes, setNotes] = useState('')
  const [orderDone, setOrderDone] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)

  const submitOrder = async () => {
    if (!product) return
    try {
      setOrderError(null)
      await createOrder({ product_id: product.id, quantity, buyer_name: buyerName, buyer_contact: buyerContact, notes })
      setOrderDone(true)
    } catch (e: any) {
      console.error('Error al crear pedido:', e?.message ?? e)
      setOrderError(e?.message ? String(e.message) : 'No se pudo enviar la solicitud. Verificá conexión y permisos (RLS).')
      setOrderDone(false)
    }
  }

  if (loading) return <div className="container py-8 text-neutral-400">Cargando...</div>
  if (!product) return <div className="container py-8 text-neutral-400">Producto no encontrado.</div>

  const imgs = product.images || []
  const mainImage = imgs[currentIndex]?.url

  const prevImage = () => {
    if (imgs.length === 0) return
    setCurrentIndex((i) => (i - 1 + imgs.length) % imgs.length)
  }
  const nextImage = () => {
    if (imgs.length === 0) return
    setCurrentIndex((i) => (i + 1) % imgs.length)
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-neutral-900">
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-500">Sin imagen</div>
            )}
            {imgs.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-neutral-800/60 px-2"
                  onClick={prevImage}
                  aria-label="Imagen anterior"
                >
                  ◄
                </Button>
                <Button
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-neutral-800/60 px-2"
                  onClick={nextImage}
                  aria-label="Imagen siguiente"
                >
                  ►
                </Button>
              </>
            )}
          </div>
          {imgs.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {imgs.map((img, idx) => (
                <button
                  key={img.id}
                  className={`h-16 w-20 shrink-0 rounded border ${idx === currentIndex ? 'border-brand' : 'border-border'}`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <img src={img.url} alt={`mini ${idx+1}`} className="h-full w-full rounded object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-4xl font-extrabold">{product.name}</h1>
          <div className="mt-4 space-y-1">
            {product.price_list != null || product.price_cash != null ? (
              <>
                {product.price_list != null && (
                  <div className="text-lg text-neutral-300"><span className="font-medium text-neutral-400">Precio de lista:</span> ${product.price_list.toFixed(2)}</div>
                )}
                {product.price_cash != null && (
                  <div className="text-2xl font-semibold"><span className="mr-2 text-neutral-400 text-base font-medium">Precio en efectivo:</span> ${product.price_cash.toFixed(2)}</div>
                )}
              </>
            ) : (
              <div className="text-3xl font-semibold"><span className="mr-2 text-neutral-400 text-base font-medium">Precio:</span> ${product.price.toFixed(2)}</div>
            )}
          </div>
          <div className="mt-2 text-sm text-neutral-300">
            <span className="mr-2 text-neutral-400">Stock:</span>
            <Badge variant={product.in_stock ? 'default' : 'secondary'}>
              {product.in_stock ? 'EN STOCK' : 'SIN STOCK'}
            </Badge>
          </div>

          <div className="mt-4 text-sm">
            <div className="text-neutral-400">Consultas y compras:</div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <a className="text-brand hover:underline" href="https://wa.me/541126048550" target="_blank" rel="noreferrer">WhatsApp 1126048550</a>
              <a className="text-brand hover:underline" href="https://wa.me/541126048606" target="_blank" rel="noreferrer">WhatsApp 1126048606</a>
              <a className="text-brand hover:underline" href="https://instagram.com/coreautotech.arg" target="_blank" rel="noreferrer">Instagram @coreautotech.arg</a>
            </div>
          </div>

          <div className="mt-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Solicitar compra</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>Solicitud de compra</DialogHeader>
                <div className="space-y-3">
                  <label className="block text-sm">Cantidad</label>
                  <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                  <label className="block text-sm">Nombre</label>
                  <Input placeholder="Tu nombre" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
                  <label className="block text-sm">Contacto (WhatsApp o email)</label>
                  <Input placeholder="Tu contacto" value={buyerContact} onChange={(e) => setBuyerContact(e.target.value)} />
                  <label className="block text-sm">Notas</label>
                  {orderError && (
                    <div className="mt-3 rounded border border-red-700 bg-red-600 p-3 text-sm font-medium text-white">
                      {orderError}
                    </div>
                  )}
                  <Input placeholder="Notas adicionales" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setOrderDone(true)}>Hablar por WhatsApp</Button>
                    <Button onClick={submitOrder}>Enviar solicitud</Button>
                  </DialogFooter>

                  {orderDone && (
                    <div className="mt-3 rounded border border-green-700 bg-green-600 p-3 text-sm font-medium text-white">
                      SOLICITUD ENVIADA CON ÉXITO. EN BREVE TE ESTAMOS CONTACTANDO.
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {product.description && (
            <div className="mt-10">
              <h2 className="mb-2 text-lg font-semibold">Descripción</h2>
              <div className="whitespace-pre-line text-neutral-300">{product.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
