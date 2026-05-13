import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Products from './pages/Products'
import Repuestos from './pages/Repuestos'
import ProductDetail from './pages/ProductDetail'
import MyPurchases from './pages/MyPurchases'
import PurchaseDetail from './pages/PurchaseDetail'
import AdminSaleDetail from './pages/AdminSaleDetail'
import CartPage from './pages/Cart'
import Admin from './pages/Admin'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { CartProvider } from './lib/cart'

export default function App() {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-14 md:pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/repuestos" element={<Repuestos />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/my-purchases" element={<MyPurchases />} />
            <Route path="/my-purchases/:id" element={<PurchaseDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/ventas/:id" element={<AdminSaleDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  )
}
