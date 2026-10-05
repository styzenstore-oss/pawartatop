import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { db, err, authUser, isAdmin } from '@/lib/server'
export async function POST(req: Request) {
  const u = await authUser(req); if (!u) return err('Login dulu', 401)
  const fd = await req.formData(), file = fd.get('file') as File | null, f = String(fd.get('folder'))
  const folder = ['product', 'poster', 'logo', 'proof'].includes(f) ? f : 'product'
  if (!(await isAdmin(u.id))) { // non-admin: logo (semua user login), foto produk (merchant aktif saja)
    if (folder === 'product') { const { data: m } = await db.from('merchants').select('status').eq('user_id', u.id).maybeSingle(); if (m?.status !== 'approved') return err('Akses ditolak', 403) }
    else if (folder !== 'logo') return err('Akses ditolak', 403)
  }
  if (!file || !file.type.startsWith('image/')) return err('File harus berupa gambar')
  if (file.size > 3_000_000) return err('Ukuran foto maksimal 3 MB')
  const path = `${folder}/${folder === 'proof' ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2, 8)}.jpg`
  const { error } = await db.storage.from('images').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: 'image/jpeg' })
  if (error) return err('Upload gagal: ' + error.message, 500)
  return NextResponse.json({ url: db.storage.from('images').getPublicUrl(path).data.publicUrl })
}
