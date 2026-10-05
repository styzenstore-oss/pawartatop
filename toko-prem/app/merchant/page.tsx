'use client'
import { useEffect, useState } from 'react'
import { api, rp, upload } from '@/lib/client'
import { Avatar, useProfile } from '@/lib/ui'
const call = (b: any) => api('/api/merchant', b)
const PL: any = { pending: 'Diproses admin', paid: 'Berhasil', rejected: 'Ditolak' }

function Apply({ init, onDone }: any) {
  const [f, setF] = useState({ store_name: init?.store_name || '', description: init?.description || '', sell_desc: init?.sell_desc || '', agree: false }), [file, setFile] = useState<File | null>(null), [m, setM] = useState(''), [busy, setBusy] = useState(false)
  const send = async () => { setBusy(true); setM(''); try { const logo_url = file ? await upload(file, 'logo') : init?.logo_url || null; await call({ action: 'apply', ...f, logo_url }); onDone() } catch (x: any) { setM(x.message) } setBusy(false) }
  return <div className="card"><h3 style={{ marginTop: 0 }}>Ajukan jadi merchant</h3>
    <input placeholder="Nama toko (jadi merek produkmu)" value={f.store_name} onChange={x => setF({ ...f, store_name: x.target.value })} />
    <span className="mute">Foto profil toko dari galeri</span><input type="file" accept="image/*" onChange={x => setFile(x.target.files?.[0] || null)} />
    <input placeholder="Deskripsi singkat toko (opsional)" value={f.description} onChange={x => setF({ ...f, description: x.target.value })} />
    <textarea rows={4} placeholder="Produk apa yang akan kamu jual? Jelaskan agar admin bisa memverifikasi (min. 20 karakter)" value={f.sell_desc} onChange={x => setF({ ...f, sell_desc: x.target.value })} />
    <div className="ann">Dilarang menjual: kartu kredit/debit beserta datanya (nomor, expired, CVV), akun hasil curian atau retas, konten dewasa 18+, narkoba, senjata, dan barang ilegal lainnya. Admin berhak menolak pengajuan atau membanned merchant yang melanggar, dan saldo merchant yang dibanned hangus.</div>
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}><input type="checkbox" style={{ width: 'auto', margin: 0 }} checked={f.agree} onChange={x => setF({ ...f, agree: x.target.checked })} />Saya setuju dengan ketentuan merchant</label>
    {m && <p className="err">{m}</p>}<button style={{ width: '100%' }} disabled={busy} onClick={send}>{busy ? 'Mengirim...' : 'Kirim pengajuan'}</button></div>
}

export default function Merchant() {
  const p = useProfile(), [d, setD] = useState<any>(undefined), [tab, setTab] = useState('ringkas'), [m, setM] = useState(''), [f, setF] = useState<any>({}), [pf, setPf] = useState<File | null>(null), [open, setOpen] = useState(''), [rows, setRows] = useState<any[]>([])
  const load = () => api('/api/merchant').then(setD).catch(x => setM(x.message))
  useEffect(() => { if (p) load() }, [p?.id])
  const act = async (b: any, after?: () => void) => { try { const r = await call(b); setM(r.added ? `${r.added} stok ditambahkan` : 'Berhasil'); await load(); after?.() } catch (x: any) { setM(x.message) } }
  const withUp = async (file: File | null, folder: 'product' | 'logo', fn: (u: string | null) => any) => { try { setM(file ? 'Mengunggah foto...' : ''); await fn(file ? await upload(file, folder) : null) } catch (x: any) { setM(x.message) } }
  const openStock = async (id: string) => { if (open === id) return setOpen(''); setOpen(id); try { setRows((await call({ action: 'listStock', product_id: id })).rows) } catch (x: any) { setM(x.message) } }
  const s = (k: string) => ({ value: f[k] ?? '', onChange: (x: any) => setF({ ...f, [k]: x.target.value }) })
  if (p === undefined || (p && d === undefined)) return <p className="mute">Memuat...</p>
  if (!p) return <><h2>Merchant</h2><div className="card"><p className="mute">Masuk dulu untuk mengajukan jadi merchant.</p><a className="btn" href="/login">Masuk atau daftar</a></div></>
  const mc = d?.merchant
  if (!mc || mc.status === 'rejected') return <><h2>Merchant</h2>{mc && <div className="card err" style={{ marginBottom: 12 }}>Pengajuan ditolak. Alasan: {mc.reject_reason}. Perbaiki lalu ajukan lagi di bawah.</div>}<Apply init={mc} onDone={load} /></>
  if (mc.status === 'pending') return <><h2>Merchant</h2><div className="card"><div className="row"><Avatar url={mc.logo_url} name={mc.store_name} size={48} /><b>{mc.store_name}</b><span className="pill">Menunggu verifikasi admin</span></div><p className="mute">Admin sedang memeriksa pengajuanmu. Kamu bisa membuka halaman ini lagi nanti.</p></div></>
  if (mc.status === 'banned') return <><h2>Merchant</h2><div className="card"><div className="row"><Avatar url={mc.logo_url} name={mc.store_name} size={48} /><b>{mc.store_name}</b><span className="pill r">Dibanned</span></div><p>Alasan: {mc.ban_reason}</p>
    {mc.appeal ? <p className="mute">Bandingmu sudah terkirim dan menunggu keputusan admin.</p> : <><textarea rows={4} placeholder="Tulis permohonan banding (min. 20 karakter)" {...s('appeal')} /><button onClick={() => act({ action: 'appeal', text: f.appeal })}>Kirim banding</button></>}{m && <p className="mute">{m}</p>}</div></>
  const sold = (d.sales || []).filter((x: any) => x.type === 'sale').reduce((a: number, x: any) => a + x.amount, 0)
  return <><div className="row" style={{ marginBottom: 12 }}><Avatar url={mc.logo_url} name={mc.store_name} size={48} /><div style={{ flex: 1 }}><h2 style={{ margin: 0 }}>{mc.store_name}</h2><span className="pill g">Merchant aktif</span></div>
    <button className="cairbadge" onClick={() => setTab('cair')}>Pencairan saldo {rp(mc.balance)}</button></div>
    <div className="seg">{[['ringkas', 'Ringkasan'], ['produk', 'Produk dan stok'], ['cair', 'Pencairan'], ['toko', 'Profil toko']].map(([k, l]) => <button key={k} className={tab === k ? '' : 'ghost'} onClick={() => setTab(k)}>{l}</button>)}</div>
    {m && <p className="mute">{m}</p>}
    {tab === 'ringkas' && <><div className="stats"><div className="card"><span className="mute">Saldo</span><div className="price">{rp(mc.balance)}</div></div><div className="card"><span className="mute">Total penjualan bersih</span><div className="price">{rp(sold)}</div></div><div className="card"><span className="mute">Produk</span><div className="price">{d.products.length}</div></div></div>
      <div className="card"><b>Penjualan terbaru</b><p className="mute" style={{ margin: '2px 0 8px' }}>Komisi platform {d.fee}% sudah dipotong.</p>{d.sales.length === 0 && <span className="mute">Belum ada penjualan.</span>}
        {d.sales.map((x: any) => <div className="row" key={x.id} style={{ marginTop: 6 }}><span style={{ flex: 1 }}>{x.note}<div className="mute" style={{ fontSize: 12 }}>{new Date(x.created_at).toLocaleString('id-ID')}</div></span><b className={x.amount < 0 ? 'err' : ''}>{x.amount < 0 ? '-' : '+'}{rp(Math.abs(x.amount))}</b></div>)}</div></>}
    {tab === 'produk' && <><div className="card" style={{ marginBottom: 12 }}><b>Tambah produk</b><input placeholder="Nama produk" {...s('pn')} /><input placeholder="Harga (angka, min. 1000)" {...s('pp')} /><input placeholder="Diskon % (opsional)" {...s('pd')} />
      <span className="mute">Foto produk dari galeri (opsional)</span><input type="file" accept="image/*" onChange={x => setPf(x.target.files?.[0] || null)} />
      <button onClick={() => withUp(pf, 'product', url => act({ action: 'addProduct', name: f.pn, price: f.pp, discount: f.pd, image_url: url }, () => { setPf(null); setF({}) }))}>Tambah produk</button></div>
      <div style={{ display: 'grid', gap: 10 }}>{d.products.map((x: any) => <div className="card" key={x.id}><div className="row">{x.image_url && <img className="thumb" src={x.image_url} alt="" />}<span style={{ flex: 1 }}><b>{x.name}</b><div className="mute">{rp(x.price)}{x.discount > 0 && ` (diskon ${x.discount}%)`} | stok {x.stock}</div></span>
        <button className="ghost sm" onClick={() => openStock(x.id)}>{open === x.id ? 'Tutup' : 'Kelola stok'}</button>
        <label className="btn sm">Ganti foto<input type="file" hidden accept="image/*" onChange={e => withUp(e.target.files?.[0] || null, 'product', url => act({ action: 'setProductImage', id: x.id, url }))} /></label>
        <button className="ghost sm" onClick={() => confirm('Hapus produk beserta seluruh stoknya?') && act({ action: 'deleteProduct', id: x.id }, () => setOpen(''))}>Hapus</button></div>
        {open === x.id && <div style={{ marginTop: 10 }}><textarea rows={4} placeholder={'Satu baris = satu stok\ncontoh: email : password : catatan'} {...s('sd')} /><button onClick={() => act({ action: 'addStock', product_id: x.id, data: f.sd }, async () => { setF({ ...f, sd: '' }); setRows((await call({ action: 'listStock', product_id: x.id })).rows) })}>Tambah stok</button>
          {rows.map(r => <div className="row" key={r.id} style={{ marginTop: 8 }}><pre style={{ flex: 1, margin: 0 }}>{r.data}</pre><button className="ghost sm" onClick={() => act({ action: 'deleteStock', id: r.id }, async () => setRows((await call({ action: 'listStock', product_id: x.id })).rows))}>Hapus</button></div>)}
          {rows.length === 0 && <p className="mute">Belum ada stok tersedia.</p>}</div>}</div>)}</div></>}
    {tab === 'cair' && <><div className="hero"><span>Saldo bisa dicairkan</span><div className="price">{rp(mc.balance)}</div></div>
      <div className="card" style={{ marginTop: 12 }}><b>Ajukan pencairan</b><p className="mute" style={{ margin: '2px 0 8px' }}>Pencairan diproses manual oleh admin. Minimal {rp(d.minPayout)}.</p><input type="number" placeholder="Nominal pencairan" {...s('pa')} /><button disabled={+f.pa < d.minPayout} onClick={() => act({ action: 'requestPayout', amount: f.pa }, () => setF({ ...f, pa: '' }))}>Ajukan pencairan</button></div>
      <div className="card" style={{ marginTop: 12 }}><b>Rekening tujuan pencairan</b>{mc.account_number && <p className="mute" style={{ margin: '2px 0 8px' }}>Saat ini: {mc.bank_name} {mc.account_number} a.n. {mc.account_name}</p>}
        <select value={f.bt ?? mc.bank_type ?? 'ewallet'} onChange={x => setF({ ...f, bt: x.target.value })}><option value="ewallet">E-Wallet</option><option value="bank">Bank</option></select>
        <input placeholder="Nama e-wallet atau bank (DANA, BCA, ...)" {...s('bn')} /><input placeholder="Nomor rekening / nomor e-wallet" inputMode="numeric" {...s('an')} /><input placeholder="Nama pemilik rekening" {...s('ao')} />
        <button onClick={() => act({ action: 'saveBank', bank_type: f.bt ?? mc.bank_type ?? 'ewallet', bank_name: f.bn, account_number: f.an, account_name: f.ao })}>Simpan rekening</button></div>
      <div className="card" style={{ marginTop: 12 }}><b>Riwayat pencairan</b>{d.payouts.length === 0 && <p className="mute">Belum ada pencairan.</p>}
        {d.payouts.map((x: any) => <div className="row" key={x.id} style={{ marginTop: 8 }}><span style={{ flex: 1 }}>{rp(x.amount)}<div className="mute" style={{ fontSize: 12 }}>{x.bank_name} {x.account_number} | {new Date(x.created_at).toLocaleString('id-ID')}{x.note && ` | ${x.note}`}</div></span>{x.proof_url && <a className="btn sm" href={x.proof_url} target="_blank">Bukti transfer</a>}<span className={'pill ' + (x.status === 'paid' ? 'g' : x.status === 'pending' ? '' : 'r')}>{PL[x.status]}</span></div>)}</div></>}
    {tab === 'toko' && <div className="card"><b>Profil toko</b><p className="mute" style={{ margin: '2px 0 8px' }}>Nama toko dan foto profil ini menjadi merek di setiap produkmu.</p><div className="row"><Avatar url={mc.logo_url} name={mc.store_name} size={56} /><b>{mc.store_name}</b></div>
      <span className="mute">Ganti foto profil dari galeri</span><input type="file" accept="image/*" onChange={x => setPf(x.target.files?.[0] || null)} /><textarea rows={3} placeholder="Deskripsi toko" value={f.ds ?? mc.description ?? ''} onChange={x => setF({ ...f, ds: x.target.value })} />
      <div className="row"><button onClick={() => withUp(pf, 'logo', url => act({ action: 'saveProfile', logo_url: url, description: f.ds ?? mc.description }, () => setPf(null)))}>Simpan</button><a className="btn ghost sm" style={{ background: 'transparent', color: 'var(--tx)', border: '1px solid var(--line)' }} href={`/toko/${mc.id}`}>Lihat halaman toko</a></div></div>}</>
}
