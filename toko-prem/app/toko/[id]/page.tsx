'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { sb } from '@/lib/client'
import { Avatar, ProductCard, addCart } from '@/lib/ui'
export default function Toko() {
  const { id } = useParams() as { id: string }, [m, setM] = useState<any>(undefined), [ps, setPs] = useState<any[]>([]), [msg, setMsg] = useState('')
  useEffect(() => { sb.from('merchants_public').select('*').eq('id', id).maybeSingle().then(r => setM(r.data)); sb.from('product_stock').select('*').eq('merchant_id', id).then(r => setPs(r.data || [])) }, [id])
  if (m === undefined) return <p className="mute">Memuat...</p>
  if (!m) return <div className="card"><p>Toko tidak ditemukan atau sedang tidak aktif.</p><a className="btn" href="/">Kembali ke beranda</a></div>
  return <><div className="card row" style={{ marginBottom: 14 }}><Avatar url={m.logo_url} name={m.store_name} size={64} /><div style={{ flex: 1 }}><h2 style={{ margin: 0 }}>{m.store_name}</h2><span className="pill g">Merchant terverifikasi</span>{m.description && <p className="mute" style={{ margin: '6px 0 0' }}>{m.description}</p>}</div></div>
    <div className="grid">{ps.map(p => <ProductCard key={p.id} p={p} add={(x: any) => { addCart(x); setMsg(`${x.name} masuk keranjang`); setTimeout(() => setMsg(''), 2200) }} />)}</div>
    {ps.length === 0 && <p className="mute">Toko ini belum punya produk.</p>}{msg && <div className="toast">{msg}</div>}</>
}
