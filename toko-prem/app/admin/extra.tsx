'use client'
import { useEffect, useState } from 'react'
import { api, rp, upload } from '@/lib/client'
import { Avatar } from '@/lib/ui'
const A = (b: any) => api('/api/admin', b)
export function MerchantAdmin() {
  const [ms, setMs] = useState<any[]>([]), [m, setM] = useState('')
  const load = () => A({ action: 'listMerchants' }).then(setMs).catch(x => setM(x.message))
  useEffect(() => { load() }, [])
  const run = async (b: any) => { try { await A(b); setM('Berhasil'); load() } catch (x: any) { setM(x.message) } }
  const ask = (t: string) => (prompt(t) || '').trim()
  const head = (x: any) => <div className="row"><Avatar url={x.logo_url} name={x.store_name} size={40} /><span style={{ flex: 1 }}><b>{x.store_name}</b><div className="mute" style={{ fontSize: 13 }}>{x.email} | {x.products} produk | saldo {rp(x.balance)}</div></span></div>
  const sec = (title: string, st: string, extra: (x: any) => any) => { const l = ms.filter(x => x.status === st); return <div className="card" style={{ marginBottom: 12 }}><b>{title} ({l.length})</b>{l.map(x => <div key={x.id} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>{head(x)}{extra(x)}</div>)}</div> }
  return <>{m && <p className="mute">{m}</p>}
    {sec('Menunggu verifikasi', 'pending', x => <><p style={{ margin: '8px 0' }}><span className="mute">Menjual:</span> {x.sell_desc}</p>{x.description && <p className="mute" style={{ margin: '0 0 8px' }}>Deskripsi toko: {x.description}</p>}
      <div className="row"><button className="sm" onClick={() => run({ action: 'approveMerchant', id: x.id })}>Setujui</button><button className="ghost sm" onClick={() => { const r = ask('Alasan penolakan (akan dilihat merchant):'); if (r) run({ action: 'rejectMerchant', id: x.id, reason: r }) }}>Tolak</button></div></>)}
    {sec('Merchant aktif', 'approved', x => <div className="row" style={{ marginTop: 8 }}><a className="btn ghost sm" style={{ background: 'transparent', color: 'var(--tx)', border: '1px solid var(--line)' }} href={`/toko/${x.id}`}>Lihat toko</a><button className="ghost sm" onClick={() => { const r = ask('Alasan banned. Saldo merchant akan HANGUS dan produk disembunyikan:'); if (r && confirm('Yakin banned? Saldo hangus tidak bisa dikembalikan otomatis.')) run({ action: 'banMerchant', id: x.id, reason: r }) }}>Banned</button></div>)}
    {sec('Dibanned', 'banned', x => <><p className="err" style={{ margin: '8px 0 4px' }}>Alasan: {x.ban_reason}</p>{x.appeal ? <p style={{ margin: '4px 0' }}><span className="mute">Banding:</span> {x.appeal}</p> : <p className="mute" style={{ margin: '4px 0' }}>Belum ada banding.</p>}<button className="sm" onClick={() => confirm('Aktifkan kembali merchant ini? Saldo yang hangus tidak dikembalikan.') && run({ action: 'unbanMerchant', id: x.id })}>Unbanned</button></>)}
    {sec('Ditolak', 'rejected', x => <p className="mute" style={{ margin: '8px 0 0' }}>Alasan: {x.reject_reason}</p>)}</>
}
export function PayoutAdmin() {
  const [ps, setPs] = useState<any[]>([]), [m, setM] = useState(''), [fee, setFee] = useState('')
  const load = () => { A({ action: 'listPayouts' }).then(setPs).catch(x => setM(x.message)); A({ action: 'getFee' }).then(r => setFee(String(r.fee))) }
  useEffect(() => { load() }, [])
  const run = async (b: any) => { try { await A(b); setM('Berhasil'); load() } catch (x: any) { setM(x.message) } }
  const pay = async (id: string, file: File | null) => { if (!file) return; try { setM('Mengunggah bukti...'); await run({ action: 'payPayout', id, proof_url: await upload(file, 'proof') }) } catch (x: any) { setM(x.message) } }
  const pend = ps.filter(x => x.status === 'pending'), done = ps.filter(x => x.status !== 'pending')
  const bank = (x: any) => <div className="mute" style={{ fontSize: 13 }}>{x.bank_type === 'bank' ? 'Bank' : 'E-Wallet'} {x.bank_name} | {x.account_number} | a.n. {x.account_name}</div>
  return <>{m && <p className="mute">{m}</p>}
    <div className="card" style={{ marginBottom: 12 }}><b>Komisi platform (%)</b><p className="mute" style={{ margin: '2px 0 8px' }}>Dipotong dari harga produk merchant tiap penjualan.</p><div className="row"><input style={{ flex: 1, margin: 0 }} type="number" value={fee} onChange={x => setFee(x.target.value)} /><button onClick={() => run({ action: 'setFee', fee })}>Simpan</button></div></div>
    <div className="card" style={{ marginBottom: 12 }}><b>Permintaan penarikan ({pend.length})</b>{pend.map(x => <div key={x.id} style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}><div className="row"><b>{x.merchants?.store_name}</b><span className="price">{rp(x.amount)}</span></div>{bank(x)}
      <div className="row" style={{ marginTop: 8 }}><label className="btn sm">Proses dan unggah bukti transfer<input type="file" hidden accept="image/*" onChange={e => pay(x.id, e.target.files?.[0] || null)} /></label><button className="ghost sm" onClick={() => { const r = (prompt('Alasan penolakan (saldo dikembalikan ke merchant):') || '').trim(); if (r) run({ action: 'rejectPayout', id: x.id, note: r }) }}>Tolak</button></div></div>)}
      {pend.length === 0 && <p className="mute">Tidak ada permintaan.</p>}</div>
    <div className="card"><b>Riwayat penarikan</b>{done.map(x => <div className="row" key={x.id} style={{ marginTop: 8 }}><span style={{ flex: 1 }}>{x.merchants?.store_name} | {rp(x.amount)}{bank(x)}</span>{x.proof_url && <a className="btn sm" href={x.proof_url} target="_blank">Bukti</a>}<span className={'pill ' + (x.status === 'paid' ? 'g' : 'r')}>{x.status === 'paid' ? 'Berhasil' : 'Ditolak'}</span></div>)}</div></>
}
