'use client'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { sb, api, rp } from '@/lib/client'
import { useProfile } from '@/lib/ui'
const L: any = { pending: 'Menunggu pembayaran', paid: 'Berhasil', late: 'Waktu bayar habis', cancelled: 'Dibatalkan' }
export default function Dompet() {
  const p = useProfile(), [bal, setBal] = useState<number | null>(null), [ts, setTs] = useState<any[]>([]), [amt, setAmt] = useState(''), [e, setE] = useState(''), [busy, setBusy] = useState(false)
  const poll = async () => { if (!p) return; try { setTs(await api('/api/topup')) } catch { } const { data } = await sb.from('profiles').select('balance').eq('id', p.id).single(); if (data) setBal(data.balance) }
  useEffect(() => { if (!p) return; poll(); const i = setInterval(poll, 5000); return () => clearInterval(i) }, [p?.id])
  const go = async () => { setBusy(true); setE(''); try { await api('/api/topup', { amount: +amt }); setAmt(''); await poll() } catch (x: any) { setE(x.message) } setBusy(false) }
  if (p === undefined) return <p className="mute">Memuat...</p>
  if (!p) return <><h2>Dompet</h2><div className="card"><p className="mute">Masuk untuk melihat dan mengisi saldo dompetmu.</p><a className="btn" href="/login">Masuk atau daftar</a></div></>
  const qr = ts.find(t => t.qris)
  return <><h2>Dompet</h2><div className="hero"><span>Saldo kamu</span><div className="price">{rp(bal ?? p.balance)}</div></div>
    <div className="card" style={{ marginTop: 12 }}><b>Isi saldo otomatis via QRIS</b>
      <div className="chips">{[10000, 25000, 50000, 100000].map(n => <button key={n} className="ghost" onClick={() => setAmt(String(n))}>{rp(n)}</button>)}</div>
      <input type="number" inputMode="numeric" placeholder="Nominal (min. Rp1.000)" value={amt} onChange={x => setAmt(x.target.value)} />
      {e && <p className="err">{e}</p>}<button style={{ width: '100%' }} disabled={busy || +amt < 1000} onClick={go}>{busy ? 'Membuat QR...' : 'Buat QRIS isi saldo'}</button></div>
    {qr && <div className="card" style={{ marginTop: 12 }}><b>Bayar {rp(qr.amount)}</b><p className="mute" style={{ margin: '4px 0' }}>Scan QR ini saja, jangan pakai screenshot QR lama. Saldo masuk otomatis setelah pembayaran terdeteksi.</p>
      <div className="qr">{/^(https?:|data:)/.test(qr.qris) ? <img src={qr.qris} width={230} alt="QRIS" /> : <QRCodeSVG value={qr.qris} size={230} />}</div></div>}
    {ts.length > 0 && <div className="card" style={{ marginTop: 12 }}><b>Riwayat isi saldo</b>{ts.map(t => <div className="row" key={t.id} style={{ marginTop: 8 }}><span style={{ flex: 1 }}>{rp(t.amount)}<div className="mute" style={{ fontSize: 12 }}>{new Date(t.created_at).toLocaleString('id-ID')}</div></span><span className={'pill ' + (t.status === 'paid' ? 'g' : t.status === 'pending' ? '' : 'r')}>{L[t.status]}</span></div>)}</div>}</>
}
