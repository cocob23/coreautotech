import { MessageCircle } from 'lucide-react'

export default function Repuestos() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black via-neutral-900 to-black">
      <div className="container flex flex-col items-center justify-center py-16 px-4 flex-1">
        
        {/* Título Principal */}
        <h1 className="text-3xl md:text-6xl font-bold text-center mb-6 text-white">
          Repuestos para tu auto
        </h1>

        {/* Descripción */}
        <p className="text-base md:text-xl text-neutral-300 text-center max-w-3xl mb-8">
          En CoreAutoTech contamos con una amplia variedad de repuestos automotrices de calidad
        </p>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 max-w-3xl w-full">
          <div className="text-center p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <div className="text-3xl mb-2">🔦💡</div>
            <div className="text-base md:text-lg font-semibold text-neutral-200">Faroles • Creed LED</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <div className="text-3xl mb-2">🪞</div>
            <div className="text-base md:text-lg font-semibold text-neutral-200">Espejos</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="text-base md:text-lg font-semibold text-neutral-200">Paragolpes</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <div className="text-3xl mb-2">⚙️</div>
            <div className="text-base md:text-lg font-semibold text-neutral-200">Kit Distribución</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <div className="text-3xl mb-2">❄️</div>
            <div className="text-base md:text-lg font-semibold text-neutral-200">Radiadores</div>
          </div>
          
          <div className="text-center p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <div className="text-3xl mb-2">🔋</div>
            <div className="text-base md:text-lg font-semibold text-neutral-200">BATERIAS</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <div className="text-3xl mb-2">🛢️</div>
            <div className="text-base md:text-lg font-semibold text-neutral-200">Aceites y Aditivos</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <div className="text-3xl mb-2">🔧</div>
            <div className="text-base md:text-lg font-semibold text-neutral-200">Repuestos de Mecánica</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-base md:text-lg font-semibold text-neutral-200">Repuestos de Chapa</div>
          </div>
        </div>

        {/* Y MUCHO MÁS */}
        <p className="text-3xl md:text-4xl font-bold text-center text-brand mb-12 animate-pulse">
          ¡Y MUCHO MÁS!
        </p>

        {/* Botón WhatsApp Gigante */}
        <a
          href="https://wa.me/5491126048550"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full max-w-2xl items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-5 font-bold text-white text-lg sm:text-xl md:px-12 md:py-8 md:text-3xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-2xl hover:shadow-green-500/50 mb-12"
        >
          <MessageCircle size={36} className="md:h-14 md:w-14" />
          <span>Consultar por WhatsApp</span>
        </a>

        {/* Separador */}
        <div className="w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-brand to-transparent mb-12"></div>

        {/* Pregunta */}
        <p className="text-xl md:text-3xl font-bold text-center text-white mb-4">
          ¿No encuentras lo que buscas?
        </p>
        <p className="text-lg md:text-xl text-neutral-300 text-center max-w-2xl mb-6">
          Tenemos más de <span className="text-2xl md:text-4xl font-bold text-brand">180.000 productos</span> disponibles
        </p>
        <p className="text-lg md:text-xl text-neutral-300 text-center max-w-2xl mb-12">
          Contáctanos ahora, seguro tenemos lo que necesitás para que tu vehículo siempre esté en perfecto estado
        </p>

        {/* Información adicional */}
        <p className="text-center text-neutral-400 mt-12 text-lg">
          Respuesta rápida • Atención personalizada • Entrega a todo el país
        </p>
      </div>
    </div>
  )
}
