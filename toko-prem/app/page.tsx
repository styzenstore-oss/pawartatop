'use client'
import { useEffect, useState } from 'react'
import { sb } from '@/lib/client'
import { Icon, ProductCard, addCart } from '@/lib/ui'
export default function Home() {
  const [ps, setPs] = useState<any[]>([]), [an, setAn] = useState<any[]>([]), [po, setPo] = useState<any[]>([]), [q, setQ] = useState(''), [msg, setMsg] = useState('')
  useEffect(() => { sb.from('product_stock').select('*').order('created_at').then(r => setPs(r.data || [])); sb.from('announcements').select('*').order('created_at', { ascending: false }).then(r => setAn(r.data || [])); sb.from('posters').select('*').order('created_at', { ascending: false }).then(r => setPo(r.data || [])) }, [])
  const add = (p: any) => { addCart(p); setMsg(`${p.name} masuk keranjang`); setTimeout(() => setMsg(''), 2200) }
  const k = q.toLowerCase(), list = ps.filter(p => p.name.toLowerCase().includes(k) || (p.store_name || '').toLowerCase().includes(k))
  return <>
    {po.length > 0 && <div className="poster">{po.map(x => <img key={x.id} src={x.image_url} alt="Poster event" />)}</div>}
    {an.map(a => <div className="ann" key={a.id}>{a.text}</div>)}
    <div className="search"><Icon n="search" /><input placeholder="Cari produk atau toko" value={q} onChange={e => setQ(e.target.value)} /></div>
    <div className="grid">{list.map(p => <ProductCard key={p.id} p={p} add={add} />)}</div>
    {list.length === 0 && <p className="mute">{ps.length ? 'Produk tidak ditemukan.' : 'Belum ada produk.'}</p>}
    {msg && <div className="toast">{msg}</div>}
  </>
}
