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
