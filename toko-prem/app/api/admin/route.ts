import { NextResponse } from 'next/server'
import { db, err, authUser, isAdmin } from '@/lib/server'
export async function POST(req: Request) {
  const u = await authUser(req); if (!u || !(await isAdmin(u.id))) return err('Akses ditolak', 403)
  const b = await req.json(); const ok = () => NextResponse.json({ ok: true })
  switch (b.action) {
    case 'addProduct': await db.from('products').insert({ name: b.name, price: +b.price, discount: +b.discount || 0, image_url: b.image_url || null }); return ok()
    case 'setProductImage': await db.from('products').update({ image_url: b.url }).eq('id', b.id); return ok()
    case 'deleteProduct': await db.from('products').delete().eq('id', b.id); return ok()
    case 'addStock': {
      const rows = String(b.data).split('\n').map(s => s.trim()).filter(Boolean).map(data => ({ product_id: b.product_id, data }))
      await db.from('stocks').insert(rows); return NextResponse.json({ ok: true, added: rows.length })
    }
    case 'listMerchants': {
      const { data } = await db.from('merchants').select('*').order('created_at', { ascending: false })
      const { data: pf } = await db.from('profiles').select('id,email').in('id', (data || []).map((m: any) => m.user_id))
      const { data: pc } = await db.from('products').select('merchant_id').not('merchant_id', 'is', null)
      const em: any = {}, n: any = {}; (pf || []).forEach((x: any) => em[x.id] = x.email); (pc || []).forEach((x: any) => n[x.merchant_id] = (n[x.merchant_id] || 0) + 1)
      return NextResponse.json((data || []).map((m: any) => ({ ...m, email: em[m.user_id], products: n[m.id] || 0 })))
    }
    case 'approveMerchant': await db.from('merchants').update({ status: 'approved', reject_reason: null }).eq('id', b.id).eq('status', 'pending'); return ok()
    case 'rejectMerchant': if (!b.reason) return err('Alasan penolakan wajib diisi'); await db.from('merchants').update({ status: 'rejected', reject_reason: b.reason }).eq('id', b.id).eq('status', 'pending'); return ok()
    case 'banMerchant': if (!b.reason) return err('Alasan banned wajib diisi'); await db.rpc('ban_merchant', { mid: b.id, reason: b.reason }); return ok()
    case 'unbanMerchant': await db.from('merchants').update({ status: 'approved', ban_reason: null, appeal: null }).eq('id', b.id).eq('status', 'banned'); return ok()
    case 'listPayouts': { const { data } = await db.from('payouts').select('*, merchants(store_name)').order('created_at', { ascending: false }).limit(100); return NextResponse.json(data || []) }
    case 'payPayout': if (!b.proof_url) return err('Bukti transfer wajib diunggah'); await db.from('payouts').update({ status: 'paid', proof_url: b.proof_url, processed_at: new Date().toISOString() }).eq('id', b.id).eq('status', 'pending'); return ok()
    case 'rejectPayout': { const { data: r } = await db.rpc('reject_payout', { pid: b.id, nt: b.note || 'Ditolak admin' }); return r ? ok() : err('Penarikan sudah diproses') }
    case 'getFee': { const { data } = await db.from('settings').select('value').eq('key', 'fee_percent').maybeSingle(); return NextResponse.json({ fee: +(data?.value || 0) }) }
    case 'setFee': { const f = Math.floor(+b.fee); if (!(f >= 0 && f <= 50)) return err('Komisi 0 sampai 50 persen'); await db.from('settings').upsert({ key: 'fee_percent', value: String(f) }); return ok() }
    case 'listVouchers': { const { data } = await db.from('vouchers').select('*'); return NextResponse.json(data) }
    case 'addVoucher': await db.from('vouchers').insert({ code: String(b.code).toUpperCase(), amount: +b.amount }); return ok()
    case 'deleteVoucher': await db.from('vouchers').delete().eq('code', b.code); return ok()
    case 'addAnnouncement': await db.from('announcements').insert({ text: b.text }); return ok()
    case 'deleteAnnouncement': await db.from('announcements').delete().eq('id', b.id); return ok()
    case 'addPoster': await db.from('posters').insert({ image_url: b.url }); return ok()
    case 'deletePoster': await db.from('posters').delete().eq('id', b.id); return ok()
    case 'changeBalance': { // amount positif = tambah, negatif = kurangi
      const { data: p } = await db.from('profiles').select('id').eq('email', b.email).maybeSingle(); if (!p) return err('Member tidak ditemukan')
      const { data: done } = await db.rpc('change_balance', { uid: p.id, amt: +b.amount }); return done ? ok() : err('Saldo tidak cukup untuk dikurangi')
    }
  }
  return err('Aksi tidak dikenal')
}
