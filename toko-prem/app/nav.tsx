'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { cart } from '@/lib/client'
import { Icon, useProfile } from '@/lib/ui'
const tabs = [['/', 'Beranda', 'home'], ['/cart', 'Keranjang', 'cart'], ['/riwayat', 'Riwayat', 'receipt'], ['/dompet', 'Dompet', 'wallet'], ['/profil', 'Profil', 'user']]
export default function Nav() {
  const path = usePathname(), p = useProfile(), [n, setN] = useState(0)
  useEffect(() => { const u = () => setN(Object.values(cart.get()).reduce((a: number, b: any) => a + b, 0)); u(); window.addEventListener('cart-change', u); window.addEventListener('storage', u); return () => { window.removeEventListener('cart-change', u); window.removeEventListener('storage', u) } }, [])
  return <>
    <header className="top"><img className="logoimg" src="/logo.png" alt="Logo" /><a className="brand" href="/">Toko Premium</a>{p === null && <a className="btn sm" href="/login">Masuk</a>}</header>
    <nav className="dock">{tabs.map(([h, l, i]) => <a key={h} href={h} className={'tab' + (path === h ? ' on' : '')}><Icon n={i} />{l}{h === '/cart' && n > 0 && <span className="cnt">{n}</span>}</a>)}</nav>
  </>
}
