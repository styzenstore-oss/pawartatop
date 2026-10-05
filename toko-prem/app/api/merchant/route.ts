import { NextResponse } from 'next/server'
import { db, err, authUser } from '@/lib/server'
const ok = (x: any = {}) => NextResponse.json({ ok: true, ...x })
const own = async (uid: string) => (await db.from('merchants').select('*').eq('user_id', uid).maybeSingle()).data
const str = (v: any, max: number) => String(v ?? '').trim().slice(0, max)
async function hGET(req: Request) {
  const u = await authUser(req); if (!u) return err('Login dulu', 401)
  const m = await own(u.id); if (!m || m.status !== 'approved') return NextResponse.json({ merchant: m })
  const { data: ps } = await db.from('products').select('*').eq('merchant_id', m.id).order('created_at', { ascending: false })
  const ids = (ps || []).map(p => p.id)
  const { data: st } = ids.length ? await db.from('stocks').select('product_id').in('product_id', ids).is('order_id', null) : { data: [] as any[] }
  const cnt: any = {}; (st || []).forEach((s: any) => cnt[s.product_id] = (cnt[s.product_id] || 0) + 1)
  const { data: sales } = await db.from('merchant_tx').select('*').eq('merchant_id', m.id).order('created_at', { ascending: false }).limit(50)
  const { data: payouts } = await db.from('payouts').select('*').eq('merchant_id', m.id).order('created_at', { ascending: false }).limit(30)
  const { data: fee } = await db.from('settings').select('value').eq('key', 'fee_percent').maybeSingle()
  return NextResponse.json({ merchant: m, products: (ps || []).map(p => ({ ...p, stock: cnt[p.id] || 0 })), sales, payouts, fee: +(fee?.value || 0), minPayout: 10000 })
}
async function hPOST(req: Request) {
  const u = await authUser(req); if (!u) return err('Login dulu', 401)
  const b = await req.json(), m = await own(u.id)
  if (b.action === 'apply') {
    if (m && m.status !== 'rejected') return err('Pengajuan sudah ada')
    const store_name = str(b.store_name, 30), sell = str(b.sell_desc, 500)
    if (store_name.length < 3) return err('Nama toko minimal 3 karakter')
    if (sell.length < 20) return err('Jelaskan produk yang akan dijual (minimal 20 karakter)')
    if (!b.agree) return err('Setujui ketentuan merchant dulu')
    const row = { store_name, logo_url: b.logo_url || null, description: str(b.description, 300), sell_desc: sell, status: 'pending', reject_reason: null }
    const { error } = m ? await db.from('merchants').update(row).eq('id', m.id) : await db.from('merchants').insert({ ...row, user_id: u.id })
    if (error) return err(error.code === '23505' ? 'Nama toko sudah dipakai' : error.message)
    return ok()
  }
  if (!m) return err('Kamu belum mendaftar sebagai merchant', 403)
  if (b.action === 'appeal') {
    const t = str(b.text, 800); if (m.status !== 'banned') return err('Akun tidak dalam status banned'); if (t.length < 20) return err('Tulis alasan banding minimal 20 karakter')
    await db.from('merchants').update({ appeal: t, appeal_at: new Date().toISOString() }).eq('id', m.id); return ok()
  }
  if (m.status !== 'approved') return err('Akun merchant belum aktif', 403)
  const prod = async (id: string) => (await db.from('products').select('id').eq('id', id).eq('merchant_id', m.id).maybeSingle()).data
  switch (b.action) {
    case 'saveBank': {
      const bank_type = b.bank_type === 'bank' ? 'bank' : 'ewallet', bank_name = str(b.bank_name, 40), account_number = str(b.account_number, 25), account_name = str(b.account_name, 60)
      if (!bank_name || !/^\d{5,25}$/.test(account_number) || account_name.length < 3) return err('Lengkapi data rekening (nomor hanya angka)')
      await db.from('merchants').update({ bank_type, bank_name, account_number, account_name }).eq('id', m.id); return ok()
    }
    case 'saveProfile': await db.from('merchants').update({ logo_url: b.logo_url || m.logo_url, description: str(b.description, 300) }).eq('id', m.id); return ok()
    case 'addProduct': {
      const name = str(b.name, 60), price = Math.floor(+b.price), discount = Math.floor(+b.discount || 0)
      if (name.length < 2 || !(price >= 1000 && price <= 10000000) || discount < 0 || discount > 90) return err('Nama, harga (min. Rp1.000), atau diskon (0-90%) tidak valid')
      await db.from('products').insert({ merchant_id: m.id, name, price, discount, image_url: b.image_url || null }); return ok()
    }
    case 'setProductImage': if (!(await prod(b.id))) return err('Produk tidak ditemukan', 404); await db.from('products').update({ image_url: b.url }).eq('id', b.id); return ok()
    case 'deleteProduct': if (!(await prod(b.id))) return err('Produk tidak ditemukan', 404); await db.from('products').delete().eq('id', b.id); return ok()
    case 'listStock': { if (!(await prod(b.product_id))) return err('Produk tidak ditemukan', 404); const { data } = await db.from('stocks').select('id,data').eq('product_id', b.product_id).is('order_id', null).order('created_at').limit(300); return ok({ rows: data || [] }) }
    case 'addStock': {
      if (!(await prod(b.product_id))) return err('Produk tidak ditemukan', 404)
      const rows = String(b.data).split('\n').map(s => s.trim().slice(0, 500)).filter(Boolean).slice(0, 500).map(data => ({ product_id: b.product_id, data }))
      if (!rows.length) return err('Isi stok kosong'); await db.from('stocks').insert(rows); return ok({ added: rows.length })
    }
    case 'deleteStock': {
      const { data: s } = await db.from('stocks').select('id,product_id').eq('id', b.id).is('order_id', null).maybeSingle()
      if (!s || !(await prod(s.product_id))) return err('Stok tidak ditemukan', 404); await db.from('stocks').delete().eq('id', b.id); return ok()
    }
    case 'requestPayout': {
      const a = Math.floor(+b.amount)
      if (!m.bank_name || !m.account_number || !m.account_name) return err('Atur rekening tujuan pencairan dulu')
      if (!(a >= 10000)) return err('Minimal pencairan Rp10.000')
      const { data: pid } = await db.rpc('request_payout', { mid: m.id, amt: a }); return pid ? ok() : err('Saldo tidak cukup')
    }
  }
  return err('Aksi tidak dikenal')
}
export async function GET(req: Request) { try { return await hGET(req) } catch (e: any) { return err('Server error: ' + e.message, 500) } }
export async function POST(req: Request) { try { return await hPOST(req) } catch (e: any) { return err('Server error: ' + e.message, 500) } }
