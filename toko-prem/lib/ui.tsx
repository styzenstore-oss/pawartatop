'use client'
import { useEffect, useState } from 'react'
import { sb, rp, cart } from './client'
const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  cart: 'M3 4h2l2.4 11h10.2l2-8H6.2M9 20h.01M17 20h.01',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  wallet: 'M3 7a2 2 0 012-2h13v4M3 7v10a2 2 0 002 2h15V9H5a2 2 0 01-2-2zM16 14h2',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
}
export const Icon = ({ n }: { n: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={P[n]} /></svg>
export const hue = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h }
export function useProfile() {
  const [p, setP] = useState<any>(undefined)
  useEffect(() => {
    const l = async () => { const { data: { user } } = await sb.auth.getUser(); if (!user) return setP(null); const { data } = await sb.from('profiles').select('*').eq('id', user.id).single(); setP(data) }
    l(); const { data: s } = sb.auth.onAuthStateChange(l); return () => s.subscription.unsubscribe()
  }, [])
  return p
}
export const addCart = (p: any) => { const c = cart.get(); c[p.id] = Math.min((c[p.id] || 0) + 1, p.stock); cart.set(c) }
export function Avatar({ url, name, size = 22 }: { url?: string; name: string; size?: number }) {
  if (url) return <img className="av" style={{ width: size, height: size }} src={url} alt="" />
  const h = hue(name || '?')
  return <span className="av" style={{ width: size, height: size, fontSize: size * .45, background: `linear-gradient(135deg,hsl(${h} 75% 52%),hsl(${(h + 50) % 360} 80% 46%))` }}>{(name || '?')[0].toUpperCase()}</span>
}
export function ProductCard({ p, add }: { p: any; add: (p: any) => void }) {
  const fin = Math.round(p.price * (100 - p.discount) / 100), h = hue(p.name)
  return <div className="card pc">
    {p.image_url ? <img className="pimg" src={p.image_url} alt={p.name} /> : <div className="tile" style={{ background: `linear-gradient(135deg,hsl(${h} 80% 56%),hsl(${(h + 55) % 360} 85% 46%))` }}>{p.name[0]}</div>}
    {p.discount > 0 && <span className="pill r disc">-{p.discount}%</span>}
    {p.merchant_id ? <a className="brand-row" href={`/toko/${p.merchant_id}`}><Avatar url={p.store_logo} name={p.store_name} />{p.store_name}</a> : <span className="brand-row"><img className="av" src="/logo.png" alt="" />Toko Premium</span>}
    <b>{p.name}</b><div>{p.discount > 0 && <span className="old">{rp(p.price)} </span>}<span className="price">{rp(fin)}</span></div>
    {p.stock > 0 ? <span className="pill g">Stok {p.stock}</span> : <span className="pill r">Habis, tidak bisa dipesan</span>}
    <button disabled={p.stock < 1} onClick={() => add(p)}>{p.stock < 1 ? 'Habis' : 'Tambah ke keranjang'}</button></div>
}
