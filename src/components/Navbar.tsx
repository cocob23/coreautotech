import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-black/40 backdrop-blur-md">
      <div className="container flex h-14 md:h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 md:gap-3">
          <img src="/logo.png" alt="Coreautotech" className="h-12 w-12 md:h-16 md:w-16 rounded shrink-0 transform scale-110 md:scale-125" onError={(e) => ((e.currentTarget.style.display = 'none'))} />
          <span className="whitespace-nowrap text-lg md:text-2xl font-extrabold tracking-wider uppercase">COREAUTOTECH</span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')}>Inicio</NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')}>Productos</NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')}>Contacto</NavLink>
        </nav>
        {/* Mobile menu toggle */}
        <button
          aria-label="Abrir menú"
          className="md:hidden rounded-md border border-border px-3 py-2 text-sm"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>
      </div>
      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden absolute left-0 right-0 top-full border-t border-border bg-black/80">
          <div className="container py-3">
            <div className="flex flex-col gap-3 text-base">
              <NavLink to="/" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')} onClick={() => setOpen(false)}>Inicio</NavLink>
              <NavLink to="/products" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')} onClick={() => setOpen(false)}>Productos</NavLink>
              <NavLink to="/contact" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')} onClick={() => setOpen(false)}>Contacto</NavLink>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
