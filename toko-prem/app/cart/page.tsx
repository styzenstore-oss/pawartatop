'use client'
import { useEffect, useState } from 'react'
import { sb, api, rp, cart } from '@/lib/client'
export default function Cart() {
  const [items, setItems] = useState<any[]>([]), [user, setUser] = useState<any>(null), [f, setF] = useState({ name: '', wa: '', voucher: '', method: 'qris' }), [e, setE] = useState(''), [busy, setBusy] = useState(false)
  const load = async () => { const c = cart.get(), ids = Object.keys(c); if (ids.length) { const { data } = await sb.from('product_stock').select('*').in('id', ids); setItems((data || []).map(p => ({ ...p, qty: p.stock < 1 ? 1 : Math.min(c[p.id], p.stock) }))) } else setItems([]) }
  useEffect(() => { load(); sb.auth.getUser().then(r => setUser(r.data.user)) }, [])
  const setQty = (id: string, q: number) => { const c = cart.get(); if (q < 1) delete c[id]; else c[id] = q; cart.set(c); load() }
  const total = items.reduce((s, p) => s + Math.round(p.price * (100 - p.discount) / 100) * p.qty, 0)
  const pay = async () => { setBusy(true); setE(''); try { const r = await api('/api/checkout', { ...f, items: items.map(p => ({ product_id: p.id, qty: p.qty })) }); cart.set({}); location.href = '/riwayat?o=' + r.id } catch (x: any) { setE(x.message); setBusy(false) } }
  if (!items.length) return <><h2>Keranjang</h2><div className="card"><p className="mute">Keranjang masih kosong.</p><a className="btn" href="/">Lihat produk</a></div></>
  return <><h2>Keranjang</h2>
    <div style={{ display: 'grid', gap: 8 }}>{items.map(p => <div className="card row" key={p.id}>{p.image_url && <img className="thumb" src={p.image_url} alt="" />}<b>{p.name}{p.stock < 1 && <span className="err"> Produk habis, hapus dari keranjang</span>}</b><span>{rp(Math.round(p.price * (100 - p.discount) / 100))}</span>
      <div className="qty"><button className="ghost" onClick={() => setQty(p.id, p.stock < 1 ? 0 : p.qty - 1)}>{p.stock < 1 ? 'Hapus' : '-'}</button>{p.stock >= 1 && p.qty}{p.stock >= 1 && <button className="ghost" disabled={p.qty >= p.stock} onClick={() => setQty(p.id, p.qty + 1)}>+</button>}</div></div>)}</div>
    <div className="hero" style={{ margin: '14px 0' }}><span>Total bayar</span><div className="price">{rp(total)}</div></div>
    {!user ? <div className="card"><p>Untuk melanjutkan pembelian, kamu perlu akun.</p><a className="btn" href="/login">Masuk atau daftar</a></div> :
      <div className="card"><input placeholder="Nama" value={f.name} onChange={x => setF({ ...f, name: x.target.value })} />
        <input placeholder="Nomor WhatsApp (opsional)" value={f.wa} onChange={x => setF({ ...f, wa: x.target.value })} />
        <input placeholder="Kode voucher (opsional)" value={f.voucher} onChange={x => setF({ ...f, voucher: x.target.value })} />
        <select value={f.method} onChange={x => setF({ ...f, method: x.target.value })}><option value="qris">QRIS otomatis</option><option value="saldo">Saldo dompet</option></select>
        {e && <p className="err">{e}</p>}<button style={{ width: '100%' }} disabled={busy || !f.name.trim() || items.some(p => p.stock < 1)} onClick={pay}>{busy ? 'Memproses...' : 'Bayar sekarang'}</button></div>}</>
}
