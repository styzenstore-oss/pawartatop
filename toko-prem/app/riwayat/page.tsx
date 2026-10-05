'use client'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, rp } from '@/lib/client'
const L: any = { pending: 'Menunggu pembayaran', paid: 'Lunas', late: 'Waktu bayar habis', expired: 'Kedaluwarsa' }
export default function Riwayat() {
  const [os, setOs] = useState<any[] | null>(null), [e, setE] = useState(''), [cp, setCp] = useState('')
  useEffect(() => { const t = () => api('/api/orders').then(setOs).catch(x => setE(x.message)); t(); const i = setInterval(t, 5000); return () => clearInterval(i) }, [])
  if (e) return <div className="card"><p className="err">{e}</p><a className="btn" href="/login">Masuk</a></div>; if (!os) return <p className="mute">Memuat...</p>
  return <><h2>Riwayat pesanan</h2>{os.length === 0 && <div className="card mute">Belum ada pesanan.</div>}
    <div style={{ display: 'grid', gap: 10 }}>{os.map(o => <div className="card" key={o.id}>
      <div className="row"><b className="price">{rp(o.total)}</b><span className={'pill ' + (o.status === 'paid' ? 'g' : o.status === 'pending' ? '' : 'r')}>{L[o.status]}</span></div>
      <div className="mute" style={{ fontSize: 13 }}>Kode {o.ref} pada {new Date(o.created_at).toLocaleString('id-ID')}</div>
      <div>{o.items.map((i: any) => `${i.name} x${i.qty}`).join(', ')}</div>
      {o.qris && <><p className="mute">Scan QR di bawah ini saja. Jangan pakai screenshot QR lama.</p><div className="qr">{/^(https?:|data:)/.test(o.qris) ? <img src={o.qris} width={230} alt="QRIS" /> : <QRCodeSVG value={o.qris} size={230} />}</div></>}
      {o.delivered?.map((d: any, i: number) => <div key={i}><span className="mute">{d.product}</span><pre>{d.data}</pre><button className="ghost sm" onClick={() => { navigator.clipboard.writeText(d.data); setCp(o.id + i); setTimeout(() => setCp(''), 1500) }}>{cp === o.id + i ? 'Tersalin' : 'Salin'}</button></div>)}
      {o.delivered && <p className="mute">Detail tersedia sampai {new Date(o.expires_at).toLocaleString('id-ID')}. Simpan datanya sebelum waktu habis.</p>}
      {o.status === 'expired' && <p className="mute">Masa aktif 24 jam telah berakhir, detail produk tidak lagi ditampilkan.</p>}</div>)}</div></>
}
