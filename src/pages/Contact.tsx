export default function Contact() {
  const phonePrimary = '541126048550'
  const phoneSecondary = '541126048606'
  const waText = encodeURIComponent('Hola! Me gustaría hacer una consulta sobre productos.')

  return (
    <div className="container py-12">
      <h1 className="text-2xl md:text-3xl font-bold">Contacto</h1>
      <p className="mt-2 text-neutral-400">Elegí el canal que prefieras y escribinos.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* WhatsApp */}
        <div className="rounded-xl border border-border bg-neutral-900/60 p-6 shadow-sm transition hover:bg-neutral-900/80 hover:shadow-md">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-green-500">
              {/* WhatsApp icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true"><path d="M20.52 3.48A11.77 11.77 0 0 0 12.04 0C5.46 0 .15 5.33.15 11.92c0 2.1.56 4.16 1.64 5.98L0 24l6.25-1.77a11.74 11.74 0 0 0 5.79 1.5h.01c6.58 0 11.89-5.33 11.89-11.91a11.8 11.8 0 0 0-3.42-8.34ZM12.05 21.5h-.01a9.6 9.6 0 0 1-4.9-1.33l-.35-.2-3.7 1.04 1-3.6-.23-.37a9.52 9.52 0 0 1-1.46-5.11c0-5.27 4.29-9.55 9.57-9.55a9.5 9.5 0 0 1 9.56 9.55c0 5.28-4.29 9.55-9.55 9.55Zm5.19-7.13c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.64.14-.19.28-.73.9-.9 1.08-.17.19-.33.21-.61.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.33.42-.49.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.49-.07-.14-.63-1.53-.87-2.09-.23-.55-.46-.47-.63-.47-.16 0-.35 0-.54 0-.19 0-.49.07-.75.35-.26.28-.99.97-.99 2.36 0 1.39 1.02 2.74 1.16 2.93.14.19 2.01 3.07 4.86 4.31.68.29 1.21.46 1.62.59.68.21 1.3.18 1.79.11.55-.08 1.66-.68 1.9-1.34.23-.66.23-1.23.16-1.34-.07-.11-.26-.18-.54-.31Z"/></svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold">WhatsApp</h2>
              <p className="text-sm text-neutral-400">Respuesta rápida y directa.</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-neutral-300">
            <div>+54 11 2604-8550</div>
            <div>+54 11 2604-8606</div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${phonePrimary}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              aria-label="Enviar mensaje por WhatsApp al 8550"
              title="Enviar por WhatsApp al +54 11 2604-8550"
            >
              Enviar al +54 11 2604-8550
            </a>
            <a
              href={`https://wa.me/${phoneSecondary}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              aria-label="Enviar mensaje por WhatsApp al 8606"
              title="Enviar por WhatsApp al +54 11 2604-8606"
            >
              Enviar al +54 11 2604-8606
            </a>
          </div>
        </div>

        {/* Instagram */}
        <div className="rounded-xl border border-border bg-neutral-900/60 p-6 shadow-sm transition hover:bg-neutral-900/80 hover:shadow-md">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-pink-500/15 text-pink-500">
              {/* Instagram icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9Zm5.5-3a1.5 1.5 0 1 1 0 3.001A1.5 1.5 0 0 1 17.5 6Z"/></svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold">Instagram</h2>
              <p className="text-sm text-neutral-400">Novedades, historias y consultas.</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-neutral-300">@coreautotech.arg</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://www.instagram.com/coreautotech.arg/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              aria-label="Abrir Instagram"
            >
              Abrir Instagram
            </a>
          </div>
        </div>

        {/* Facebook */}
        <div className="rounded-xl border border-border bg-neutral-900/60 p-6 shadow-sm transition hover:bg-neutral-900/80 hover:shadow-md">
          <div className="flex items-center gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-500">
              {/* Facebook icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.87v-6.98H7.9V12h2.5V9.8c0-2.47 1.47-3.83 3.72-3.83 1.08 0 2.22.19 2.22.19v2.44h-1.25c-1.23 0-1.61.76-1.61 1.54V12h2.74l-.44 2.89h-2.3v6.98A10 10 0 0 0 22 12Z"/></svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold">Facebook</h2>
              <p className="text-sm text-neutral-400">Publicaciones y mensajes.</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-neutral-300">Coreautotech</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://www.facebook.com/coreautotech.arg"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              aria-label="Abrir Facebook"
            >
              Abrir Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
