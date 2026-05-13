import { supabase } from './supabaseClient'

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'publico'

export async function uploadProductImageFile(productId: number, file: File): Promise<{ path: string; url: string }> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const key = `productos/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(key, file, { upsert: false, cacheControl: '3600' })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key)
  return { path: key, url: data.publicUrl }
}

function extractStoragePathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const marker = '/object/public/'
    const idx = parsed.pathname.indexOf(marker)
    if (idx === -1) return null
    const tail = parsed.pathname.slice(idx + marker.length) // bucket/key
    const firstSlash = tail.indexOf('/')
    if (firstSlash === -1) return null
    return decodeURIComponent(tail.slice(firstSlash + 1))
  } catch {
    return null
  }
}

export async function deleteStorageFileByPublicUrl(url: string): Promise<void> {
  const path = extractStoragePathFromPublicUrl(url)
  if (!path) return
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}
