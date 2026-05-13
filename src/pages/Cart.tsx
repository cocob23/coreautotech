import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Price } from '../components/ui/Price'
import { useCart } from '../lib/cart'
import { createPurchase } from '../lib/purchaseAPI'
import { validateEmail, validatePhoneNumber } from '../lib/validation'
import { DEPOSITO_CONFIG, SHIPPING_RATES } from '../lib/config'

type MetodoEntrega = 'retiro' | 'envio'
type ZonaEnvio = 'capital_federal' | 'gba' | 'interior'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, totalAmount, removeItem, updateQuantity, clearCart } = useCart()
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [metodoEntrega, setMetodoEntrega] = useState<MetodoEntrega>('envio')
  const [zonaEnvio, setZonaEnvio] = useState<ZonaEnvio>('capital_federal')
  const [direccion, setDireccion] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [referencia, setReferencia] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [dniError, setDniError] = useState<string | null>(null)
  const [successIds, setSuccessIds] = useState<number[]>([])

  const zonaEnvioLabel = useMemo(() => {
    if (zonaEnvio === 'capital_federal') return 'Capital Federal'
    if (zonaEnvio === 'gba') return 'GBA'
    return 'Interior y otras provincias'
  }, [zonaEnvio])

  const costoEnvioSeleccionado = useMemo(() => {
    if (zonaEnvio === 'capital_federal') return SHIPPING_RATES.caba
    if (zonaEnvio === 'gba') return SHIPPING_RATES.gba
    return SHIPPING_RATES.interior
  }, [zonaEnvio])

  const envioTexto = useMemo(() => {
    if (metodoEntrega === 'retiro') return `${DEPOSITO_CONFIG.label} - ${DEPOSITO_CONFIG.direccion}`
    const detail = [direccion.trim(), localidad.trim(), provincia.trim(), codigoPostal.trim()]
      .filter(Boolean)
      .join(', ')
    return detail ? `Envío (${zonaEnvioLabel}) a: ${detail}` : `Envío (${zonaEnvioLabel}) a coordinar`
  }, [metodoEntrega, direccion, localidad, provincia, codigoPostal, zonaEnvioLabel])

  const costoEnvio = metodoEntrega === 'envio' ? costoEnvioSeleccionado : 0
  const totalCompra = totalAmount + costoEnvio

  const finalizarCompra = async (e: FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setPhoneError(null)
    setDniError(null)
    
    if (items.length === 0) {
      setError('Tu carrito está vacío')
      return
    }
    if (!nombre.trim()) {
      setError('Completa tu nombre')
      return
    }
    const dniDigits = dni.replace(/\D/g, '')
    if (dniDigits.length < 7 || dniDigits.length > 10) {
      setError('DNI inválido')
      setDniError('Ingresa un DNI válido (solo números)')
      return
    }
    if (!validateEmail(email)) {
      setError('Email inválido')
      setEmailError('Ingresa un email válido')
      return
    }
    if (telefono.trim() && !validatePhoneNumber(telefono)) {
      setError('Teléfono inválido')
      setPhoneError('Ingresa un teléfono válido (mínimo 7 dígitos)')
      return
    }
    if (metodoEntrega === 'envio' && !direccion.trim()) {
      setError('Completa la dirección de envío')
      return
    }
    if (metodoEntrega === 'envio' && !localidad.trim()) {
      setError('Completa la localidad para el envío')
      return
    }
    if (metodoEntrega === 'envio' && !provincia.trim()) {
      setError('Completa la provincia para el envío')
      return
    }
    if (metodoEntrega === 'envio' && !codigoPostal.trim()) {
      setError('Completa el código postal para el envío')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessIds([])

    try {
      const createdIds: number[] = []

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index]
        const costoEnvioAplicado = index === 0 ? costoEnvio : 0
        const notasCompra = [
          `Pagador: ${nombre.trim()} | DNI: ${dniDigits}`,
          item.variantLabel ? `Posición de farol: ${item.variantLabel}` : '',
          notas.trim(),
          metodoEntrega === 'envio' ? 'Entrega: envío' : 'Entrega: retiro en depósito',
          metodoEntrega === 'envio' ? `Zona envío: ${zonaEnvioLabel}` : '',
          metodoEntrega === 'envio' ? `Dirección envío: ${direccion.trim()}` : '',
          metodoEntrega === 'envio' ? `Localidad envío: ${localidad.trim()}` : '',
          metodoEntrega === 'envio' ? `Provincia envío: ${provincia.trim()}` : '',
          metodoEntrega === 'envio' ? `CP envío: ${codigoPostal.trim()}` : '',
          metodoEntrega === 'envio' && referencia.trim() ? `Referencia envío: ${referencia.trim()}` : '',
          envioTexto,
        ]
          .filter(Boolean)
          .join(' | ')

        const compra = await createPurchase(
          item.productId,
          item.quantity,
          email.trim(),
          nombre.trim(),
          telefono.trim() || undefined,
          item.priceUnit * item.quantity + costoEnvioAplicado,
          notasCompra
        )

        createdIds.push(compra.id)

      }

      clearCart()
      setSuccessIds(createdIds)

      const params = new URLSearchParams({ email: email.trim() })
      if (createdIds.length > 0) {
        params.set('highlightPurchaseId', String(createdIds[0]))
      }
      params.set('showTransferInfo', '1')
      navigate(`/my-purchases?${params.toString()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo finalizar la compra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="container py-10">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Carrito</h1>
        <p className="text-neutral-300 mb-8">Confirma tus productos y completa tus datos para comprar.</p>

        {successIds.length > 0 && (
          <div className="mb-6 rounded-lg border border-green-700/40 bg-green-950/30 p-4">
            <div className="flex items-start gap-2 text-green-100">
              <CheckCircle2 className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-semibold">Compra registrada correctamente</p>
                <p className="text-sm mt-1">Números de compra: {successIds.map((x) => `#${x}`).join(', ')}</p>
                <Link to="/my-purchases" className="text-sm font-semibold underline mt-2 inline-block text-green-200 hover:text-green-100">
                  Ver estado en Mis Compras
                </Link>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-700/40 bg-red-950/30 p-4 text-red-100 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-10 text-center">
            <ShoppingCart className="h-12 w-12 text-neutral-500 mx-auto mb-3" />
            <p className="text-neutral-100 font-semibold">Tu carrito está vacío</p>
            <Link to="/products" className="inline-block mt-4 text-brand font-semibold">
              Ir a productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.lineId} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-neutral-100">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="h-20 w-24 rounded border border-neutral-800 bg-neutral-950 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-neutral-400">Sin imagen</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-100">{item.name}</p>
                      {item.variantLabel && (
                        <p className="text-xs text-neutral-300">Posición de farol: {item.variantLabel}</p>
                      )}
                      <p className="flex flex-wrap items-baseline gap-1 text-sm text-neutral-400">
                        <Price amount={item.priceUnit} className="text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" />
                        <span>c/u</span>
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="secondary" onClick={() => updateQuantity(item.lineId, item.quantity - 1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="min-w-8 text-center text-neutral-100">{item.quantity}</span>
                        <Button variant="secondary" onClick={() => updateQuantity(item.lineId, item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => removeItem(item.lineId)} className="ml-2 text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-left text-lg font-semibold text-neutral-100 sm:text-right">
                      <Price amount={item.quantity * item.priceUnit} className="font-semibold text-neutral-100" integerClassName="text-lg" centsClassName="text-[0.55em]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <form onSubmit={finalizarCompra} className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-5 text-neutral-100">
                <h2 className="text-lg font-bold text-neutral-100">Finalizar compra</h2>
                <div className="space-y-1 text-sm text-neutral-300">
                  <p>Subtotal productos: <Price amount={totalAmount} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" /></p>
                  <p>Envío: <Price amount={costoEnvio} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" /></p>
                  <p>Total compra: <Price amount={totalCompra} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" /></p>
                </div>
                <p className="text-sm text-neutral-300">Poner nombre y DNI de la persona que va a realizar el pago.</p>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-100">Nombre de quien realiza el pago</label>
                  <Input className="bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellido" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-100">DNI de quien realiza el pago</label>
                  <Input
                    className={`bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400 ${
                      dniError ? 'border-red-700 focus:border-red-600' : ''
                    }`}
                    value={dni}
                    onChange={(e) => {
                      setDni(e.target.value)
                      setDniError(null)
                    }}
                    inputMode="numeric"
                    placeholder="Ej: 44798539"
                  />
                  {dniError && <p className="text-red-400 text-xs mt-1">{dniError}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-100">Email</label>
                  <Input 
                    className={`bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400 ${
                      emailError ? 'border-red-700 focus:border-red-600' : ''
                    }`}
                    type="email" 
                    value={email} 
                    onChange={(e) => { setEmail(e.target.value); setEmailError(null); }} 
                    placeholder="tu@email.com" 
                  />
                  {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-100">Teléfono (opcional)</label>
                  <Input 
                    className={`bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400 ${
                      phoneError ? 'border-red-700 focus:border-red-600' : ''
                    }`}
                    value={telefono} 
                    onChange={(e) => { setTelefono(e.target.value); setPhoneError(null); }} 
                    placeholder="11 1234 5678" 
                  />
                  {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-100">Método de entrega</label>
                  <select
                    value={metodoEntrega}
                    onChange={(e) => setMetodoEntrega(e.target.value as MetodoEntrega)}
                    className={`w-full rounded-lg px-3 py-2 text-neutral-100 ${
                      metodoEntrega === 'retiro'
                        ? 'border border-green-600 bg-green-950/30'
                        : 'border border-neutral-700 bg-neutral-950'
                    }`}
                  >
                    <option value="envio">Envío</option>
                    <option value="retiro">{DEPOSITO_CONFIG.label}</option>
                  </select>
                </div>

                {metodoEntrega === 'envio' && (
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-neutral-100">Zona de envío</label>
                    <select
                      value={zonaEnvio}
                      onChange={(e) => setZonaEnvio(e.target.value as ZonaEnvio)}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100"
                    >
                      <option value="capital_federal">Capital Federal</option>
                      <option value="gba">GBA</option>
                      <option value="interior">Interior y otras provincias</option>
                    </select>

                    <label className="mb-1 block text-sm font-semibold text-neutral-100">Dirección de envío</label>
                    <Input
                      className="bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Calle y número"
                    />

                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        className="bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400"
                        value={localidad}
                        onChange={(e) => setLocalidad(e.target.value)}
                        placeholder="Localidad"
                      />
                      <Input
                        className="bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400"
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value)}
                        placeholder="Provincia"
                      />
                    </div>

                    <Input
                      className="mt-2 bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400"
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      placeholder="Código postal"
                    />

                    <Input
                      className="mt-2 bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      placeholder="Referencia (opcional: piso, dpto, entre calles)"
                    />

                    <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-300">
                      <p className="font-semibold text-neutral-100">Tarifas de envío</p>
                      <p>Capital Federal: <span className="font-semibold text-neutral-100">$ {SHIPPING_RATES.caba.toLocaleString('es-AR')}</span></p>
                      <p>GBA: <span className="font-semibold text-neutral-100">$ {SHIPPING_RATES.gba.toLocaleString('es-AR')}</span></p>
                      <p>Interior y otras provincias: <span className="font-semibold text-neutral-100">$ {SHIPPING_RATES.interior.toLocaleString('es-AR')}</span></p>
                      <p className="mt-2 text-green-300">Zona seleccionada ({zonaEnvioLabel}): <span className="font-semibold">$ {costoEnvioSeleccionado.toLocaleString('es-AR')}</span></p>
                    </div>
                  </div>
                )}

                {metodoEntrega === 'retiro' && (
                  <div className="rounded-lg border border-green-700/40 bg-green-950/20 p-3">
                    <p className="mb-1 text-sm font-semibold text-green-100">{DEPOSITO_CONFIG.label}</p>
                    <p className="text-sm text-green-200">{DEPOSITO_CONFIG.direccion}</p>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-100">Notas (opcional)</label>
                  <Textarea className="bg-neutral-950 border-neutral-700 text-neutral-100 placeholder:text-neutral-400" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Observaciones para tu compra" />
                </div>

                <Button disabled={loading} className="w-full bg-green-600 text-white hover:bg-green-500">
                  {loading ? 'Procesando...' : 'Comprar'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
