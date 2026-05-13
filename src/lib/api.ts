import { supabase } from './supabaseClient'
import type { Category, Product, ProductImage, Order, CategoriaRow, ProductoRow, ImagenRow, PedidoRow } from './types'

// Map DB (ES) -> App (EN) shapes
function mapCategory(row: CategoriaRow): Category {
  return { id: row.id, name: row.nombre, slug: row.slug }
}

function mapProduct(row: ProductoRow): Product {
  const price_list = row.precio_lista !== undefined && row.precio_lista !== null ? Number(row.precio_lista) : null
  const price_cash = row.precio_efectivo !== undefined && row.precio_efectivo !== null ? Number(row.precio_efectivo) : null
  return {
    id: row.id,
    name: row.nombre,
    description: row.descripcion ?? null,
    price: Number(price_list ?? price_cash ?? 0),
    price_list,
    price_cash,
    stock: Number(row.stock ?? 0),
    in_stock: Boolean(row.en_stock),
    category_id: row.categoria_id ?? null,
    created_at: row.creado_en,
    updated_at: row.actualizado_en,
  }
}

function mapImage(row: ImagenRow): ProductImage {
  return {
    id: row.id,
    product_id: row.producto_id,
    url: row.url,
    created_at: row.creado_en,
    order: row.orden ?? null,
  }
}

function mapOrder(row: PedidoRow): Order {
  return {
    id: row.id,
    product_id: row.producto_id ?? null,
    quantity: row.cantidad,
    buyer_name: row.nombre_cliente ?? null,
    buyer_contact: row.contacto_cliente ?? null,
    status: row.estado,
    notes: row.notas ?? null,
    created_at: row.creado_en,
  }
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categorias').select('id, nombre, slug').order('nombre')
  if (error) throw error
  return (data ?? []).map(mapCategory)
}

export type ProductFilter = { categorySlug?: string; search?: string; inStockOnly?: boolean; limit?: number; offset?: number }

export async function getProducts(filter: ProductFilter = {}): Promise<(Product & { images: ProductImage[]; category?: Category })[]> {
  let query = supabase.from('productos').select('id, nombre, descripcion, precio_lista, precio_efectivo, stock, en_stock, categoria_id, creado_en, actualizado_en, imagenes(*), categoria:categoria_id(id, nombre, slug)')
  if (filter.inStockOnly) query = query.eq('en_stock', true)
  if (filter.search) query = query.ilike('nombre', `%${filter.search}%`)
  if (filter.categorySlug) {
    const { data: cats } = await supabase.from('categorias').select('id').eq('slug', filter.categorySlug).limit(1)
    const catId = cats?.[0]?.id
    if (catId) query = query.eq('categoria_id', catId)
  }
  // Stable ordering to avoid page overlap/duplicates
  query = query.order('creado_en', { ascending: false }).order('id', { ascending: false })

  // Apply pagination if provided (after ordering)
  const limit = filter.limit
  const offset = filter.offset ?? 0
  if (typeof limit === 'number' && limit > 0) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, error } = await query
  if (error) throw error
  interface ProductoWithRelations extends ProductoRow {
    imagenes?: ImagenRow[]
    categoria?: CategoriaRow
  }
  return (data as ProductoWithRelations[] ?? []).map((p) => ({
    ...mapProduct(p),
    images: (p.imagenes ?? [])
      .map(mapImage)
      .sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || (a.created_at || '').localeCompare(b.created_at || '')),
    category: p.categoria ? mapCategory(p.categoria) : undefined,
  }))
}

export async function getProductById(id: number): Promise<(Product & { images: ProductImage[]; category?: Category }) | null> {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, descripcion, precio_lista, precio_efectivo, stock, en_stock, categoria_id, creado_en, actualizado_en, imagenes(*), categoria:categoria_id(id, nombre, slug)')
    .eq('id', id)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  interface ProductoWithRelations extends ProductoRow {
    imagenes?: ImagenRow[]
    categoria?: CategoriaRow
  }
  const producto = data as ProductoWithRelations
  return {
    ...mapProduct(producto),
    images: (producto.imagenes ?? [])
      .map(mapImage)
      .sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || (a.created_at || '').localeCompare(b.created_at || '')),
    category: producto.categoria ? mapCategory(producto.categoria) : undefined,
  }
}

export async function createOrder(input: { product_id: number; quantity: number; buyer_name?: string; buyer_contact?: string; notes?: string }): Promise<Order> {
  const { data, error } = await supabase
    .from('pedidos')
    .insert({
      producto_id: input.product_id,
      cantidad: input.quantity,
      nombre_cliente: input.buyer_name,
      contacto_cliente: input.buyer_contact,
      notas: input.notes,
      estado: 'pendiente',
    })
    .select('*')
    .single()
  if (error) throw error
  return mapOrder(data)
}

// Admin writes (MVP: relies on permissive RLS per tu configuración)
export async function addProduct(p: { name: string; description?: string; price_list?: number | null; price_cash?: number | null; stock: number; category_id?: number | null }): Promise<Product> {
  const { data, error } = await supabase
    .from('productos')
    .insert({ nombre: p.name, descripcion: p.description, precio_lista: p.price_list ?? null, precio_efectivo: p.price_cash ?? null, stock: p.stock, categoria_id: p.category_id ?? null })
    .select('*')
    .single()
  if (error) throw error
  return mapProduct(data as ProductoRow)
}

export async function updateProduct(id: number, p: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'in_stock'>>): Promise<Product> {
  const patch: Partial<ProductoRow> = {}
  if (p.name !== undefined) patch.nombre = p.name
  if (p.description !== undefined) patch.descripcion = p.description
  if (p.price_list !== undefined) patch.precio_lista = p.price_list
  if (p.price_cash !== undefined) patch.precio_efectivo = p.price_cash
  if (p.stock !== undefined) patch.stock = p.stock
  if (p.category_id !== undefined) patch.categoria_id = p.category_id

  const { data, error } = await supabase
    .from('productos')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapProduct(data as ProductoRow)
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) throw error
}

export async function addProductImage(product_id: number, url: string): Promise<ProductImage> {
  const { data, error } = await supabase.from('imagenes').insert({ producto_id: product_id, url }).select('*').single()
  if (error) throw error
  return mapImage(data as ImagenRow)
}

export async function deleteProductImage(id: number): Promise<void> {
  const { error } = await supabase.from('imagenes').delete().eq('id', id)
  if (error) throw error
}

export async function reorderProductImages(productId: number, orderedIds: number[]): Promise<void> {
  // Simple per-row updates; fine for small image counts
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i]
    const { error } = await supabase.from('imagenes').update({ orden: i }).eq('id', id).eq('producto_id', productId)
    if (error) throw error
  }
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase.from('pedidos').select('*').order('creado_en', { ascending: false })
  if (error) {
    console.warn('No se pudieron obtener pedidos (¿RLS restringido?):', error.message)
    return []
  }
  return (data as PedidoRow[] ?? []).map(mapOrder)
}

export async function updateOrderStatus(id: number, status: string): Promise<Order> {
  const { data, error } = await supabase.from('pedidos').update({ estado: status }).eq('id', id).select('*').single()
  if (error) throw error
  return mapOrder(data as PedidoRow)
}

// Categorías CRUD
export async function addCategory(name: string, slug?: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categorias')
    .insert({ nombre: name, slug: slug })
    .select('*')
    .single()
  if (error) throw error
  return mapCategory(data as CategoriaRow)
}

export async function updateCategory(id: number, fields: { name?: string; slug?: string }): Promise<Category> {
  const patch: Partial<CategoriaRow> = {}
  if (fields.name !== undefined) patch.nombre = fields.name
  if (fields.slug !== undefined) patch.slug = fields.slug
  const { data, error } = await supabase
    .from('categorias')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return mapCategory(data as CategoriaRow)
}

export async function deleteCategory(id: number): Promise<void> {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}
