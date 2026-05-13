import { useEffect, useState, useRef, type ChangeEvent } from 'react'
import { Upload, AlertCircle, CheckCircle, Loader, MessageCircle, Mail } from 'lucide-react'
import { Button } from './ui/Button'
import { deletePaymentProofByPurchase, getCurrentPaymentProofByPurchase, uploadPaymentProof } from '../lib/purchaseAPI'
import { uploadProductImageFile } from '../lib/storage'
import type { Purchase } from '../lib/types'
import type { PaymentProof } from '../lib/types'
import { deleteStorageFileByPublicUrl } from '../lib/storage'
import { PAYMENT_INFO, SUPPORT_CONTACT, WHATSAPP_NUMBERS } from '../lib/config'

interface PaymentProofUploadProps {
  purchase: Purchase
  onUploadSuccess?: () => void
}

export default function PaymentProofUpload({ purchase, onUploadSuccess }: PaymentProofUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [currentProof, setCurrentProof] = useState<PaymentProof | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayFileName = (name: string, max = 44) => {
    if (name.length <= max) return name
    const extIndex = name.lastIndexOf('.')
    if (extIndex <= 0) return `${name.slice(0, max - 1)}...`
    const ext = name.slice(extIndex)
    const base = name.slice(0, extIndex)
    const allowedBase = Math.max(8, max - ext.length - 3)
    return `${base.slice(0, allowedBase)}...${ext}`
  }

  const whatsappMessage = encodeURIComponent(
    `Hola! Te envío el comprobante de pago de la compra #${purchase.id}.`
  )

  const whatsappLinks = [
    {
      label: '+54 9 11 2261-2859',
      href: `https://wa.me/${WHATSAPP_NUMBERS.primary}?text=${whatsappMessage}`,
    },
    {
      label: '+54 9 11 7140-5601',
      href: `https://wa.me/${WHATSAPP_NUMBERS.secondary}?text=${whatsappMessage}`,
    },
  ]

  const mailHref = `mailto:${SUPPORT_CONTACT.email}?subject=${encodeURIComponent(
    `Comprobante de pago compra #${purchase.id}`
  )}`

  useEffect(() => {
    void loadCurrentProof()
  }, [purchase.id])

  const loadCurrentProof = async () => {
    try {
      const proof = await getCurrentPaymentProofByPurchase(purchase.id)
      setCurrentProof(proof)
    } catch {
      // ignore
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(selected.type)) {
      setError('Solo se permiten archivos JPG, PNG, WebP o PDF')
      return
    }

    // Validate file size (5MB max)
    if (selected.size > 5 * 1024 * 1024) {
      setError('El archivo no puede exceder 5MB')
      return
    }

    setFile(selected)
    setError(null)
    setSuccess(false)
  }

  const handleUpload = async () => {
    if (!file) return
    if (currentProof) {
      setError('Ya hay un comprobante cargado. Elimínalo para subir otro.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Upload file to storage
      const uploaded = await uploadProductImageFile(purchase.producto_id, file)

      // Create payment proof record
      await uploadPaymentProof(purchase.id, uploaded.url, file.name)
      await loadCurrentProof()

      setSuccess(true)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Call success callback
      onUploadSuccess?.()

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el comprobante')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCurrentProof = async () => {
    if (!currentProof) return
    setLoading(true)
    setError(null)
    try {
      await deletePaymentProofByPurchase(purchase.id)
      await deleteStorageFileByPublicUrl(currentProof.url_archivo)
      setCurrentProof(null)
      setSuccess(false)
      onUploadSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el comprobante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center bg-neutral-900 hover:border-neutral-500 transition-colors">
        <Upload className="mx-auto h-12 w-12 text-neutral-500 mb-3" />

        <h3 className="font-semibold text-lg mb-2 text-neutral-100">Cargar Comprobante de Pago</h3>
        <p className="text-sm text-neutral-300 mb-4">
          Sube una imagen del comprobante de tu transferencia (JPG, PNG, WebP o PDF)
        </p>

        {!currentProof && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={loading}
          />
        )}

        {!currentProof && (
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="mb-3 w-full max-w-full overflow-hidden"
            title={file ? file.name : 'Seleccionar archivo'}
          >
            <span className="block w-full truncate text-center">
              {file ? file.name : 'Seleccionar archivo'}
            </span>
          </Button>
        )}

        {currentProof && (
          <div className="mb-4 rounded-lg border border-yellow-700/40 bg-yellow-950/30 p-3 text-left text-sm text-yellow-100">
            <p className="font-semibold">Comprobante cargado</p>
            <p className="mt-1">Estado: esperando aprobación del pago.</p>
            <div className="mt-3 flex gap-2">
              <a
                href={currentProof.url_archivo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 underline"
              >
                Ver comprobante
              </a>
              <Button variant="outline" onClick={handleDeleteCurrentProof} disabled={loading}>
                Eliminar y subir nuevo
              </Button>
            </div>
          </div>
        )}

        {file && (
          <div className="mb-4 rounded-lg border border-neutral-700 bg-neutral-950/80 p-3 text-left">
            <p className="text-sm text-neutral-300">Archivo seleccionado:</p>
            <p className="mt-1 max-w-full truncate text-base font-semibold text-neutral-100" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-neutral-400">
              Tamaño: {(file.size / 1024 / 1024).toFixed(2)}MB
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-300 text-sm mb-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-green-300 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>¡Comprobante cargado exitosamente!</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || loading || !!currentProof}
          className="w-full bg-green-600 text-white hover:bg-green-500"
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            'Cargar Comprobante'
          )}
        </Button>
      </div>

      <div className="mt-6 rounded-lg border border-green-700/40 bg-green-950/20 p-4">
        <h4 className="mb-2 font-semibold text-green-100">Datos para transferir:</h4>
        <div className="space-y-1 text-sm text-green-200">
          <p><span className="font-semibold">CVU:</span> {PAYMENT_INFO.cbu}</p>
          <p><span className="font-semibold">ALIAS:</span> {PAYMENT_INFO.alias}</p>
          <p><span className="font-semibold">CUIT:</span> {PAYMENT_INFO.cuit}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-teal-700/40 bg-teal-950/20 p-4">
        <h4 className="mb-2 font-semibold text-teal-100">También puedes enviar el comprobante por:</h4>
        <div className="flex flex-wrap gap-2">
          {whatsappLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-teal-700/40 bg-teal-900/40 px-3 py-2 text-sm text-teal-100 hover:bg-teal-900/60"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp {item.label}
            </a>
          ))}
          <a
            href={mailHref}
            className="inline-flex items-center gap-2 rounded-md border border-teal-700/40 bg-teal-900/40 px-3 py-2 text-sm text-teal-100 hover:bg-teal-900/60"
          >
            <Mail className="h-4 w-4" />
            {SUPPORT_CONTACT.email}
          </a>
        </div>
      </div>

      <div className="mt-4 bg-blue-950/30 border border-blue-700/40 rounded-lg p-4">
        <h4 className="font-semibold text-blue-100 mb-2">Instrucciones:</h4>
        <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
          <li>Realiza una transferencia a nuestra cuenta</li>
          <li>Toma una captura del comprobante de la transferencia</li>
          <li>Sube la imagen aquí para que nuestro equipo lo valide</li>
          <li>Te notificaremos por email una vez aprobado</li>
        </ol>
      </div>

      {purchase.estado === 'pago_recibido' && (
        <div className="mt-4 bg-yellow-950/30 border border-yellow-700/40 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-100">
            <Loader className="h-5 w-5" />
            <p className="font-semibold">Comprobante cargado, esperando aprobación del pago.</p>
          </div>
        </div>
      )}

      {purchase.estado === 'aprobado' && (
        <div className="mt-4 bg-green-950/30 border border-green-700/40 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-100">
            <CheckCircle className="h-5 w-5" />
            <p className="font-semibold">¡Tu pago ha sido aprobado!</p>
          </div>
        </div>
      )}
    </div>
  )
}
