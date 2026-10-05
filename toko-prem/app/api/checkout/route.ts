import { NextResponse } from 'next/server'
import { db, err, authUser } from '@/lib/server'
import { createQris } from '@/lib/stenly'
async function hPOST(req: Request) {
  const u = await authUser(req); if (!u) return err('Silakan login dulu', 401)
  const { items, name, wa, method, voucher } = await req.json()
  if (!name?.trim() || !items?.length) return err('Nama dan keranjang wajib diisi')
  const { data: ps } = await db.from('product_stock').select('*').in('id', items.map((i: any) => i.product_id))
  let total = 0; const lines: any[] = []
  for (const i of items) {
    const p = ps?.find((x: any) => x.id === i.product_id); const q = Math.max(1, parseInt(i.qty) || 1)
    if (!p) return err('Produk tidak ditemukan'); if (p.stock < q) return err(`Stok ${p.name} tidak cukup`)
    const price = Math.round(p.price * (100 - (p.discount || 0)) / 100); total += price * q
    lines.push({ merchant_id: p.merchant_id || null, product_id: p.id, name: p.name, qty: q, price })
  }
  let vcode = null
  if (voucher?.trim()) {
    const { data: v } = await db.from('vouchers').select('*').eq('code', voucher.trim().toUpperCase()).maybeSingle()
    if (!v) return err('Voucher tidak valid'); total = Math.max(1000, total - v.amount); vcode = v.code
  }
  const ref = 'INV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase() // <=25 karakter sesuai aturan StenlyPay
  const { data: o, error: oe } = await db.from('orders').insert({ gateway_ref: ref, user_id: u.id, buyer_name: name, wa: wa || null, items: lines, total, voucher: vcode, method }).select().single()
  if (!o) return err('Gagal membuat pesanan: ' + (oe?.message || ''), 500)
  if (method === 'saldo') {
    const { data: ok } = await db.rpc('change_balance', { uid: u.id, amt: -total })
    if (!ok) { await db.from('orders').delete().eq('id', o.id); return err('Saldo tidak cukup') }
    await db.rpc('fulfill_order', { oid: o.id }); return NextResponse.json({ id: o.id })
  }
  try {
    const q = await createQris(ref, total, name, wa)
    await db.from('orders').update({ gateway_ref: q.ref, qris: q.qr }).eq('id', o.id)
    return NextResponse.json({ id: o.id })
  } catch (e: any) { await db.from('orders').delete().eq('id', o.id); return err(`${e.message} [ref terkirim: ${ref}, ${ref.length} karakter]`, 502) }
}
export async function POST(req: Request) { try { return await hPOST(req) } catch (e: any) { return err('Server error: ' + e.message, 500) } }
