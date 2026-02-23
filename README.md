# Coreautotech — Ecommerce React + Supabase

Sitio ecommerce en React (Vite) con TailwindCSS, componentes estilo shadcn (locales), React Router y Supabase.

## Requisitos
- Node.js 18+
- Cuenta y proyecto en Supabase

## Instalación
```bash
npm install
cp .env.example .env.local
```
Edita `.env.local` con:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_KEY` (clave para acceder al panel admin)

## Ejecutar en desarrollo
```bash
npm run dev
```

## Supabase: Tablas y políticas
El SQL está en `supabase/schema.sql`.
1. En el panel de Supabase, ve a SQL Editor y ejecuta el contenido del archivo.
2. Opcional: crea un bucket público `product-images` para subir imágenes y usar sus URLs.

Nota: Las políticas están abiertas para MVP (lectura pública, escritura para productos e imágenes, insertar órdenes). Debes **endurecer** esto para producción (ej: usar JWT con rol admin, funciones Edge o una API backend).

## Panel Admin
- Ruta: `/admin`
- Acceso: ingresa la clave `VITE_ADMIN_KEY`.
- Funciones: crear/editar/eliminar productos, manejar stock y precio, agregar/quitar imágenes por URL, ver y actualizar estado de órdenes.

## Carga de imágenes
- Usa URLs públicas (ej: desde Supabase Storage bucket público).
- Coloca el logo en `public/logo.jfif`.

## Branding
- Color principal configurable en Ajustes (HSL) que actualiza `--brand`.
- Estilo oscuro por defecto, acorde a estética automotriz/tuning.

## Contacto
- WhatsApp: 1126048550 / 1126048606
- Instagram: https://www.instagram.com/coreautotech.arg/
- Facebook: https://www.facebook.com/coreautotech.arg

## Estructura
- `src/pages`: Home, Products, ProductDetail, Admin, Contact
- `src/components`: Navbar, Footer, ProductCard
- `src/components/ui`: Button, Input, Badge, Tabs, Dialog
- `src/lib`: supabaseClient, api, types

## Próximos pasos (recomendados)
- Implementar auth de Supabase para admins (JWT con claim `role=admin`).
- Migrar políticas para permitir solo admins en writes.
- Subir imágenes vía UI al bucket de Supabase.
- Agregar filtros avanzados y categorías visibles.
- Integrar pagos (MercadoPago, etc.) cuando lo definas.
