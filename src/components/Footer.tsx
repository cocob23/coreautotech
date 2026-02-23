export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container py-8 text-sm text-neutral-400">
        <div className="flex flex-col gap-2">
          <p>
            © {new Date().getFullYear()} Coreautotech — Repuestos y accesorios tuning.
          </p>
          <p className="flex gap-4">
            <a href="https://www.instagram.com/coreautotech.arg/" target="_blank" rel="noreferrer" className="hover:text-brand">Instagram</a>
            <a href="https://www.facebook.com/coreautotech.arg" target="_blank" rel="noreferrer" className="hover:text-brand">Facebook</a>
            <a href="https://wa.me/541126048550" target="_blank" rel="noreferrer" className="hover:text-brand">WhatsApp 1126048550</a>
            <a href="https://wa.me/541126048606" target="_blank" rel="noreferrer" className="hover:text-brand">WhatsApp 1126048606</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
