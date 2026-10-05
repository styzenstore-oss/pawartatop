import { createClient } from '@supabase/supabase-js'
export const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export async function api(path: string, body?: any) {
  const { data } = await sb.auth.getSession()
  const r = await fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (data.session?.access_token || '') }, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || `Server error (${r.status}), cek log Vercel`); return j
}
export const rp = (n: number) => 'Rp' + Number(n).toLocaleString('id-ID')
export const cart = { get: (): Record<string, number> => JSON.parse(localStorage.getItem('cart') || '{}'), set: (c: any) => { localStorage.setItem('cart', JSON.stringify(c)); window.dispatchEvent(new Event('cart-change')) } }
export async function compress(file: File, max: number): Promise<Blob> {
  let img: ImageBitmap; try { img = await createImageBitmap(file) } catch { throw new Error('Format foto tidak didukung, pakai JPG atau PNG') }
  const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas')
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  return new Promise(r => c.toBlob(b => r(b!), 'image/jpeg', 0.82))
}
export async function upload(file: File, folder: 'product' | 'poster' | 'logo' | 'proof') {
  const blob = await compress(file, folder === 'poster' ? 1600 : folder === 'proof' ? 1400 : 900), fd = new FormData(); fd.append('file', blob, 'img.jpg'); fd.append('folder', folder)
  const { data } = await sb.auth.getSession()
  const r = await fetch('/api/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + (data.session?.access_token || '') }, body: fd })
  const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Upload gagal'); return j.url as string
}
