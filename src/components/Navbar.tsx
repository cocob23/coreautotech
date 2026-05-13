import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { ShoppingCart, Package } from 'lucide-react'
import { useCart } from '../lib/cart'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { totalItems } = useCart()
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-black/40 backdrop-blur-md">
      <div className="container flex h-14 md:h-16 items-center justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-2 md:gap-3">
          <img src="/logo.png" alt="Coreautotech" className="h-12 w-12 md:h-16 md:w-16 rounded shrink-0 transform scale-110 md:scale-125" onError={(e) => ((e.currentTarget.style.display = 'none'))} />
          <span className="truncate text-sm sm:text-base md:text-2xl font-extrabold tracking-wider uppercase">COREAUTOTECH</span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')}>Inicio</NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')}>Productos</NavLink>
          <NavLink to="/carrito" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')}>
            <span className="inline-flex items-center gap-2">
              <ShoppingCart size={16} />
              Carrito
              {totalItems > 0 && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-black font-bold">{totalItems}</span>
              )}
            </span>
          </NavLink>
          <NavLink to="/my-purchases" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')}>
            <span className="inline-flex items-center gap-2">
              <Package size={16} />
              Mis compras
            </span>
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')}>Contacto</NavLink>
        </nav>
        {/* Mobile menu toggle */}
        <button
          aria-label="Abrir menú"
          className="ml-2 shrink-0 md:hidden rounded-md border border-border px-3 py-2 text-sm"
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
              <NavLink to="/carrito" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')} onClick={() => setOpen(false)}>
                Carrito {totalItems > 0 ? `(${totalItems})` : ''}
              </NavLink>
              <NavLink to="/my-purchases" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')} onClick={() => setOpen(false)}>
                Mis compras
              </NavLink>
              <NavLink to="/contact" className={({ isActive }) => (isActive ? 'text-brand' : 'hover:text-brand')} onClick={() => setOpen(false)}>Contacto</NavLink>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
