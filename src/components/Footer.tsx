export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container py-8 text-sm text-neutral-400">
        <div className="flex flex-col gap-2">
          <p>
            © {new Date().getFullYear()} Coreautotech — Repuestos y accesorios tuning.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="https://www.instagram.com/coreautotech.arg/" target="_blank" rel="noreferrer" className="hover:text-brand">Instagram</a>
            <a href="https://www.facebook.com/coreautotech.arg" target="_blank" rel="noreferrer" className="hover:text-brand">Facebook</a>
            <a href="https://wa.me/5491122612859" target="_blank" rel="noreferrer" className="hover:text-brand">WhatsApp +54 9 11 2261-2859</a>
            <a href="https://wa.me/5491171405601" target="_blank" rel="noreferrer" className="hover:text-brand">WhatsApp +54 9 11 7140-5601</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
