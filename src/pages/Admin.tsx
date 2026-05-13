import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '../components/ui/Dialog'
import { Boxes, Tags, ReceiptText, Truck } from 'lucide-react'
// removed Textarea usage for image URLs
import { Button } from '../components/ui/Button'
import PaymentProofsAdmin from '../components/SalesProofsAdmin'
import ShipmentsAdmin from '../components/ShipmentsAdmin'
import { addProduct, deleteProduct, getCategories, getProducts, updateProduct, addProductImage, deleteProductImage, addCategory, deleteCategory, updateCategory, reorderProductImages } from '../lib/api'
import { uploadProductImageFile } from '../lib/storage'
import { slugify } from '../utils/slugify'
import { Price } from '../components/ui/Price'
import type { Category, Product } from '../lib/types'

function useAdminAuth() {
  const [ok, setOk] = useState(false)
  const ADMIN = import.meta.env.VITE_ADMIN_KEY || ''
  useEffect(() => {
    const stored = localStorage.getItem('adminKey')
    setOk(Boolean(stored && ADMIN && stored === ADMIN))
  }, [])
  const login = (key: string) => { localStorage.setItem('adminKey', key); setOk(Boolean(ADMIN && key === ADMIN)) }
  const logout = () => { localStorage.removeItem('adminKey'); setOk(false) }
  return { ok, login, logout }
}

export default function Admin() {
  const auth = useAdminAuth()
  const [loginKey, setLoginKey] = useState('')

  if (!auth.ok) {
    return (
      <div className="container max-w-md py-8 sm:py-12">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-2 text-sm text-neutral-400">Ingresa la clave de administrador para continuar.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input type="password" placeholder="ADMIN_KEY" value={loginKey} onChange={(e) => setLoginKey(e.target.value)} />
          <Button className="w-full sm:w-auto" onClick={() => auth.login(loginKey)}>Entrar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Panel Admin</h1>
        <Button className="w-full sm:w-auto" variant="secondary" onClick={() => auth.logout()}>Salir</Button>
      </div>
      <p className="mb-4 text-sm text-neutral-400">
        Gestiona el catálogo, valida comprobantes y administra envíos/retiros desde secciones separadas.
      </p>

      <Tabs defaultValue="catalogo">
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-0">
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="logistica">Logística</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-4">
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-neutral-900 p-4">
              <div className="mb-2 flex items-center gap-2 text-neutral-200">
                <Boxes className="h-4 w-4" />
                <span className="font-semibold">Productos</span>
              </div>
              <p className="text-sm text-neutral-400">Alta, edición, stock e imágenes.</p>
            </div>
            <div className="rounded-lg border border-border bg-neutral-900 p-4">
              <div className="mb-2 flex items-center gap-2 text-neutral-200">
                <Tags className="h-4 w-4" />
                <span className="font-semibold">Categorías</span>
              </div>
              <p className="text-sm text-neutral-400">Organización del catálogo por rubro.</p>
            </div>
          </div>

          <Tabs defaultValue="products">
            <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-0 md:w-[420px]">
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="categories">Categorías</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <ProductsAdmin />
            </TabsContent>
            <TabsContent value="categories">
              <CategoriesAdmin />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="ventas" className="mt-4">
          <div className="mb-4 rounded-lg border border-border bg-neutral-900 p-4">
            <div className="mb-2 flex items-center gap-2 text-neutral-200">
              <ReceiptText className="h-4 w-4" />
              <span className="font-semibold">Validación de pagos</span>
            </div>
            <p className="text-sm text-neutral-400">Revisa comprobantes y aprueba/rechaza pagos.</p>
          </div>
          <PaymentProofsAdmin />
        </TabsContent>

        <TabsContent value="logistica" className="mt-4">
          <div className="mb-4 rounded-lg border border-border bg-neutral-900 p-4">
            <div className="mb-2 flex items-center gap-2 text-neutral-200">
              <Truck className="h-4 w-4" />
              <span className="font-semibold">Envíos y retiros</span>
            </div>
            <p className="text-sm text-neutral-400">Carga tracking y marca productos listos para retirar.</p>
          </div>
          <ShipmentsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductsAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>('')

  const reload = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [cats, prods] = await Promise.all([getCategories(), getProducts({})])
      setCategories(cats as Category[])
      setProducts(prods as Product[])
    } catch (e: any) {
      console.error('Error cargando categorías/productos:', e?.message || e)
      setLoadError(e?.message ? String(e.message) : 'No se pudieron cargar categorías/productos. Verificá conexión y políticas RLS (SELECT).')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const [form, setForm] = useState({ name: '', description: '', price_list: '', price_cash: '', stock: '0', category_id: '' })
  // remove image URLs input; only file uploads
  const [createFiles, setCreateFiles] = useState<File[]>([])
  const [createdOk, setCreatedOk] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [productEditor, setProductEditor] = useState<{
    id: number
    name: string
    price_list: string
    price_cash: string
  } | null>(null)
  const [savingProductEditor, setSavingProductEditor] = useState(false)
  const [descriptionEditor, setDescriptionEditor] = useState<{ id: number; name: string; value: string } | null>(null)
  const [savingDescription, setSavingDescription] = useState(false)
  const removeCreateFile = (idx: number) => {
    setCreateFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const add = async () => {
    const cat = categories.find((c) => String(c.id) === form.category_id)
    try {
      setErrorMsg('')
      const product = await addProduct({
        name: form.name,
        description: form.description,
        price_list: form.price_list ? Number(form.price_list) : null,
        price_cash: form.price_cash ? Number(form.price_cash) : null,
        stock: Number(form.stock),
        category_id: cat?.id ?? null,
      })
      if (createFiles.length > 0) {
        for (const f of createFiles) {
          const { url } = await uploadProductImageFile(product.id, f)
          await addProductImage(product.id, url)
        }
      }
      setForm({ name: '', description: '', price_list: '', price_cash: '', stock: '0', category_id: '' })
      setCreateFiles([])
      setCreatedOk(true)
      setTimeout(() => setCreatedOk(false), 4000)
      reload()
    } catch (err: any) {
      console.error('Error al crear producto o subir imágenes:', err?.message || err)
      setErrorMsg(err?.message || 'Falló la subida de imágenes. Verifica el bucket/políticas de Storage.')
    }
  }

  const update = async (id: number, p: any) => { await updateProduct(id, p); reload() }
  const del = async (id: number) => { await deleteProduct(id); reload() }

  // removed per-product URL image adder; only file uploads
  const delImage = async (imageId: number) => { await deleteProductImage(imageId); reload() }

  const [filesMap, setFilesMap] = useState<Record<number, File[]>>({})
  const [localImages, setLocalImages] = useState<Record<number, any[]>>({})
  const onFilesChange = (productId: number, files: FileList | null) => {
    setFilesMap((prev) => ({
      ...prev,
      [productId]: [...(prev[productId] || []), ...(files ? Array.from(files) : [])],
    }))
  }
  const uploadFiles = async (productId: number) => {
    const files = filesMap[productId] || []
    if (files.length === 0) return
    try {
      setErrorMsg('')
      for (const f of files) {
        const { url } = await uploadProductImageFile(productId, f)
        await addProductImage(productId, url)
      }
      setFilesMap((prev) => ({ ...prev, [productId]: [] }))
      reload()
    } catch (err: any) {
      console.error('Error al subir archivos:', err?.message || err)
      setErrorMsg(err?.message || 'Falló la subida de archivos. Revisa el bucket y permisos.')
    }
  }

  return (
    <div className="py-6">
      <h2 className="text-lg font-semibold">Agregar producto</h2>
      {createdOk && (
        <div className="mt-2 rounded border border-green-700 bg-green-600 p-3 text-sm text-white">
          Producto cargado con éxito.
        </div>
      )}
      {loadError && (
        <div className="mt-2 rounded border border-red-700 bg-red-600 p-3 text-sm text-white">
          {loadError}
        </div>
      )}
      {errorMsg && (
        <div className="mt-2 rounded border border-red-700 bg-red-600 p-3 text-sm text-white">
          {errorMsg}
        </div>
      )}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-6">
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Nombre</label>
          <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Precio de lista</label>
          <Input type="number" inputMode="decimal" placeholder="0" value={form.price_list} onChange={(e) => setForm((f) => ({ ...f, price_list: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Precio en efectivo</label>
          <Input type="number" inputMode="decimal" placeholder="0" value={form.price_cash} onChange={(e) => setForm((f) => ({ ...f, price_cash: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Stock</label>
          <Input type="number" placeholder="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-400">Categoría</label>
          <select className="h-9 w-full rounded-md border border-input bg-neutral-900 px-3 text-sm text-white" value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
            <option className="bg-neutral-900 text-white" value="">Sin categoría</option>
            {categories.map((c) => (<option className="bg-neutral-900 text-white" key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        <div className="flex items-end">
          <Button onClick={add}>Agregar</Button>
        </div>
        <div className="md:col-span-6">
          <label className="mb-1 block text-sm text-neutral-400">Descripción</label>
          <Textarea rows={6} placeholder="Descripción (podés usar Enter para saltos de línea)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-sm font-medium">Subir archivos (múltiples)</div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setCreateFiles((prev) => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])])}
        />
        {createFiles.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {createFiles.map((file, idx) => (
              <div key={idx} className="relative">
                <img src={URL.createObjectURL(file)} alt={file.name} className="h-20 w-28 rounded border border-border object-cover" />
                <Button variant="ghost" className="absolute right-1 top-1 h-6 px-2 text-xs" onClick={() => removeCreateFile(idx)}>×</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Listado</h2>
        {loading ? (
          <div className="text-neutral-400">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {products.map((p) => (
              <div key={p.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-right text-sm text-neutral-300">
                    {p.price_cash != null && (
                      <div className="flex flex-wrap items-baseline gap-1"><span className="text-neutral-500">Efectivo:</span> <Price amount={p.price_cash} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" /></div>
                    )}
                    {p.price_list != null && (
                      <div className="flex flex-wrap items-baseline gap-1 text-neutral-400"><span className="text-neutral-500">Lista:</span> <Price amount={p.price_list} className="text-neutral-400" integerClassName="text-sm" centsClassName="text-[0.55em]" /></div>
                    )}
                    {p.price_cash == null && p.price_list == null && (
                      <div><Price amount={p.price} className="font-semibold text-neutral-100" integerClassName="text-sm" centsClassName="text-[0.55em]" /></div>
                    )}
                    <div className="text-neutral-500">stock {p.stock}</div>
                  </div>
                </div>
                <div className="mt-2 whitespace-pre-line text-sm text-neutral-400">{p.description}</div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary" onClick={() => update(p.id, { stock: p.stock + 1 })}>+1 stock</Button>
                  <Button variant="secondary" onClick={() => update(p.id, { stock: Math.max(0, p.stock - 1) })}>-1 stock</Button>
                  <Button variant="secondary" onClick={() => {
                    setProductEditor({
                      id: p.id,
                      name: p.name || '',
                      price_list: p.price_list != null ? String(p.price_list) : '',
                      price_cash: p.price_cash != null ? String(p.price_cash) : '',
                    })
                  }}>Editar nombre y precios</Button>
                  <Button variant="secondary" onClick={() => {
                    setDescriptionEditor({ id: p.id, name: p.name, value: p.description || '' })
                  }}>Editar descripción</Button>
                  <Button variant="outline" onClick={() => del(p.id)}>Eliminar</Button>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-medium">Imágenes</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(localImages[p.id] ?? p.images ?? []).map((img: any, idx: number) => (
                      <div
                        key={img.id}
                        className="relative"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(idx))
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const from = Number(e.dataTransfer.getData('text/plain'))
                          const to = idx
                          const list = [...(localImages[p.id] ?? p.images ?? [])]
                          const [moved] = list.splice(from, 1)
                          list.splice(to, 0, moved)
                          setLocalImages((prev) => ({ ...prev, [p.id]: list }))
                        }}
                      >
                        <img src={img.url} className="h-20 w-28 rounded border border-border object-cover" />
                        <Button variant="ghost" className="absolute right-1 top-1 h-6 px-2 text-xs" onClick={() => delImage(img.id)}>Quitar</Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const imgs = (localImages[p.id] ?? p.images ?? [])
                        await reorderProductImages(p.id, imgs.map((i: any) => i.id))
                        setLocalImages((prev) => ({ ...prev, [p.id]: undefined as any }))
                        reload()
                      }}
                    >Guardar orden</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setLocalImages((prev) => ({ ...prev, [p.id]: undefined as any }))}
                    >Reiniciar</Button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input type="file" multiple accept="image/*" onChange={(e) => onFilesChange(p.id, e.target.files)} />
                    <Button variant="secondary" onClick={() => uploadFiles(p.id)}>Subir archivos</Button>
                  </div>
                  {(filesMap[p.id] || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(filesMap[p.id] || []).map((file, idx) => (
                        <div key={idx} className="relative">
                          <img src={URL.createObjectURL(file)} alt={file.name} className="h-16 w-20 rounded border border-border object-cover" />
                          <Button variant="ghost" className="absolute right-1 top-1 h-5 px-2 text-xs" onClick={() => setFilesMap((prev) => ({
                            ...prev,
                            [p.id]: (prev[p.id] || []).filter((_, i) => i !== idx),
                          }))}>×</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(productEditor)}
        onOpenChange={(open) => {
          if (!open && !savingProductEditor) setProductEditor(null)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            Editar nombre y precios{productEditor?.name ? `: ${productEditor.name}` : ''}
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-neutral-300">Nombre</label>
              <Input
                placeholder="Nombre del producto"
                value={productEditor?.name || ''}
                onChange={(e) => setProductEditor((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Precio de lista</label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Vacío = sin precio de lista"
                value={productEditor?.price_list || ''}
                onChange={(e) => setProductEditor((prev) => (prev ? { ...prev, price_list: e.target.value } : prev))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-neutral-300">Precio en efectivo</label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Vacío = sin precio en efectivo"
                value={productEditor?.price_cash || ''}
                onChange={(e) => setProductEditor((prev) => (prev ? { ...prev, price_cash: e.target.value } : prev))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" disabled={savingProductEditor} onClick={() => setProductEditor(null)}>Cancelar</Button>
            <Button
              disabled={!productEditor || savingProductEditor}
              onClick={async () => {
                if (!productEditor) return
                if (!productEditor.name.trim()) {
                  setErrorMsg('El nombre del producto no puede estar vacío.')
                  return
                }
                const listRaw = productEditor.price_list.trim()
                const cashRaw = productEditor.price_cash.trim()
                const parsedList = listRaw === '' ? null : Number(listRaw)
                const parsedCash = cashRaw === '' ? null : Number(cashRaw)
                if ((parsedList !== null && Number.isNaN(parsedList)) || (parsedCash !== null && Number.isNaN(parsedCash))) {
                  setErrorMsg('Revisá los precios: deben ser números válidos.')
                  return
                }
                try {
                  setSavingProductEditor(true)
                  setErrorMsg('')
                  await update(productEditor.id, {
                    name: productEditor.name.trim(),
                    price_list: parsedList,
                    price_cash: parsedCash,
                  })
                  setProductEditor(null)
                } finally {
                  setSavingProductEditor(false)
                }
              }}
            >
              {savingProductEditor ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(descriptionEditor)}
        onOpenChange={(open) => {
          if (!open && !savingDescription) setDescriptionEditor(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            Editar descripción{descriptionEditor?.name ? `: ${descriptionEditor.name}` : ''}
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-neutral-300">Descripción</label>
            <Textarea
              rows={12}
              placeholder="Escribí una descripción con saltos de línea..."
              value={descriptionEditor?.value || ''}
              onChange={(e) => setDescriptionEditor((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
            />
            <p className="text-xs text-neutral-500">Podés usar Enter para separar párrafos o listas.</p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={savingDescription}
              onClick={() => setDescriptionEditor(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={!descriptionEditor || savingDescription}
              onClick={async () => {
                if (!descriptionEditor) return
                try {
                  setSavingDescription(true)
                  await update(descriptionEditor.id, { description: descriptionEditor.value })
                  setDescriptionEditor(null)
                } finally {
                  setSavingDescription(false)
                }
              }}
            >
              {savingDescription ? 'Guardando...' : 'Guardar descripción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoriesAdmin() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  const reload = () => { setLoading(true); getCategories().then(setCategories).finally(() => setLoading(false)) }
  useEffect(() => { reload() }, [])

  const addCat = async () => {
    if (!name.trim()) return
    const slug = slugify(name)
    await addCategory(name.trim(), slug)
    setName('')
    reload()
  }

  const renameCat = async (c: any) => {
    const newName = prompt('Nuevo nombre', c.name)
    if (!newName || !newName.trim()) return
    const newSlug = slugify(newName)
    await updateCategory(c.id, { name: newName.trim(), slug: newSlug })
    reload()
  }

  const removeCat = async (id: number) => { await deleteCategory(id); reload() }

  return (
    <div className="py-6">
      <h2 className="text-lg font-semibold">Categorías</h2>
      <div className="mt-3 flex gap-2 max-w-md">
        <Input placeholder="Nombre de categoría" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={addCat}>Agregar</Button>
      </div>
      <div className="mt-6">
        {loading ? (
          <div className="text-neutral-400">Cargando...</div>
        ) : categories.length === 0 ? (
          <div className="text-neutral-400">No hay categorías</div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded border border-border p-3">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-neutral-500">slug: {c.slug}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => renameCat(c)}>Renombrar</Button>
                  <Button variant="outline" onClick={() => removeCat(c.id)}>Eliminar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
