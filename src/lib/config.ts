/**
 * Configuración de la aplicación
 */

// Información del depósito/local
export const DEPOSITO_CONFIG = {
  nombre: 'Depósito CoreAutoTech',
  direccion: 'Uspallata 1951, Barracas, CABA',
  tipo: 'deposito', // 'deposito' o 'local'
  label: 'Retiro en depósito',
  searchKey: 'retiro en deposito', // Lo que se busca en notas para detectar retiros
} as const

export const PAYMENT_INFO = {
  titular: 'CoreAutoTech',
  banco: 'Transferencia CVU',
  alias: 'COREAUTOTECH',
  cbu: '4530000800019617723455',
  cuit: '20-44798539-0',
  referencia: 'Al transferir, colocar el numero de compra en el concepto.',
} as const

export const SUPPORT_CONTACT = {
  email: 'coreautotechar@gmail.com',
} as const

// Tarifas de envío por zona
export const SHIPPING_RATES = {
  caba: 20000,
  gba: 28000,
  interior: 40000,
} as const

// Contacto de propietario
export const OWNER_EMAILS = ['conrastef@gmail.com', 'renzobautista05@gmail.com'] as const

// Números de WhatsApp para contacto
export const WHATSAPP_NUMBERS = {
  primary: '5491122612859',
  secondary: '5491171405601',
} as const

// Instagram y Facebook
export const SOCIAL_MEDIA = {
  instagram: 'coreautotech.arg',
  facebook: 'coreautotech.arg',
} as const
