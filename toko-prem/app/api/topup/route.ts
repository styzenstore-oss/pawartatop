import { NextResponse } from 'next/server'
import { db, err, authUser } from '@/lib/server'
import { createQris, isPaid, cancelCharge } from '@/lib/stenly'
async function hGET(req: Request) {
  const u = await authUser(req); if (!u) return err('Login dulu', 401)
  const { data: pend } = await db.from('topups').select('id,ref').eq('user_id', u.id).eq('status', 'pending')
  for (const t of pend || []) if (await isPaid(t.ref)) await db.rpc('fulfill_topup', { tid: t.id })
  const { data } = await db.from('topups').select('*').eq('user_id', u.id).order('created_at', { ascending: false }).limit(10)
  const now = Date.now()
  return NextResponse.json((data || []).map(t => { const late = t.status === 'pending' && now - new Date(t.created_at).getTime() > 20 * 60000; return { id: t.id, ref: t.ref, amount: t.amount, status: late ? 'late' : t.status, qris: t.status === 'pending' && !late ? t.qris : null, created_at: t.created_at } }))
}
async function hPOST(req: Request) {
  const u = await authUser(req); if (!u) return err('Login dulu', 401)
  const a = Math.floor(Number((await req.json()).amount))
  if (!(a >= 1000 && a <= 10000000)) return err('Nominal isi saldo Rp1.000 sampai Rp10.000.000')
  const { data: old } = await db.from('topups').select('id,ref').eq('user_id', u.id).eq('status', 'pending')
  for (const t of old || []) { // QR lama dibatalkan agar tidak dibayar ganda
    if (await isPaid(t.ref)) await db.rpc('fulfill_topup', { tid: t.id })
    else { await cancelCharge(t.ref).catch(() => {}); await db.from('topups').update({ status: 'cancelled' }).eq('id', t.id).eq('status', 'pending') }
  }
  const ref = 'TUP' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
  const { data: t, error: ie } = await db.from('topups').insert({ user_id: u.id, amount: a, ref }).select().single()
  if (!t) return err('Gagal membuat isi saldo: ' + (ie?.message || 'tabel topups belum ada, jalankan migrasi-v4.sql'), 500)
  try { const q = await createQris(ref, a); await db.from('topups').update({ qris: q.qr }).eq('id', t.id); return NextResponse.json({ id: t.id }) }
  catch (e: any) { await db.from('topups').delete().eq('id', t.id); return err(`${e.message} [ref terkirim: ${ref}, ${ref.length} karakter]`, 502) }
}
export async function GET(req: Request) { try { return await hGET(req) } catch (e: any) { return err('Server error: ' + e.message, 500) } }
export async function POST(req: Request) { try { return await hPOST(req) } catch (e: any) { return err('Server error: ' + e.message, 500) } }
