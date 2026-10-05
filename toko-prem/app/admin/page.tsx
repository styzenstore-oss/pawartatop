'use client'
import { useEffect, useState } from 'react'
import { sb, api, rp, upload } from '@/lib/client'
import { MerchantAdmin, PayoutAdmin } from './extra'
const F = ({ title, children }: any) => <div className="card" style={{ marginBottom: 12 }}><b>{title}</b><div style={{ marginTop: 8 }}>{children}</div></div>
export default function Admin() {
  const [ok, setOk] = useState(false), [ps, setPs] = useState<any[]>([]), [vs, setVs] = useState<any[]>([]), [an, setAn] = useState<any[]>([]), [po, setPo] = useState<any[]>([]), [f, setF] = useState<any>({}), [m, setM] = useState(''), [why, setWhy] = useState(''), [tab, setTab] = useState('toko'), [pf, setPf] = useState<File | null>(null), [pof, setPof] = useState<File | null>(null)
  const load = async () => { sb.from('product_stock').select('*').then(r => setPs(r.data || [])); sb.from('announcements').select('*').then(r => setAn(r.data || [])); sb.from('posters').select('*').then(r => setPo(r.data || [])); api('/api/admin', { action: 'listVouchers' }).then(setVs) }
  useEffect(() => { api('/api/admin', { action: 'listVouchers' }).then(() => { setOk(true); load() }).catch(x => { setOk(false); setWhy(x.message) }) }, [])
  const run = async (b: any) => { try { const r = await api('/api/admin', b); setM(r.added ? `${r.added} stok ditambahkan` : 'Berhasil'); load() } catch (x: any) { setM(x.message) } }
  const withUp = async (file: File | null, folder: 'product' | 'poster', fn: (url: string | null) => Promise<any>) => { try { setM(file ? 'Mengunggah foto...' : ''); await fn(file ? await upload(file, folder) : null) } catch (x: any) { setM(x.message) } }
  const s = (k: string) => ({ value: f[k] || '', onChange: (x: any) => setF({ ...f, [k]: x.target.value }) })
  if (!ok) return <p className="err">Halaman ini khusus admin. ({why || 'memeriksa...'})</p>
  return <><h2>Admin panel</h2><div className="seg">{[['toko', 'Toko'], ['merchant', 'Merchant'], ['tarik', 'Penarikan']].map(([k, l]) => <button key={k} className={tab === k ? '' : 'ghost'} onClick={() => setTab(k)}>{l}</button>)}</div>{tab === 'merchant' && <MerchantAdmin />}{tab === 'tarik' && <PayoutAdmin />}{tab === 'toko' && <>{m && <p className="mute">{m}</p>}
    <F title="Produk"><input placeholder="Nama produk" {...s('pn')} /><input placeholder="Harga (angka)" {...s('pp')} /><input placeholder="Diskon % (opsional)" {...s('pd')} />
      <span className="mute">Foto produk dari galeri (opsional)</span><input type="file" accept="image/*" onChange={x => setPf(x.target.files?.[0] || null)} />
      {pf && <img className="pimg" style={{ maxWidth: 200, marginBottom: 10 }} src={URL.createObjectURL(pf)} alt="" />}
      <button onClick={() => withUp(pf, 'product', async url => { await run({ action: 'addProduct', name: f.pn, price: f.pp, discount: f.pd, image_url: url }); setPf(null) })}>Tambah produk</button>
      {ps.map(p => <div className="row" key={p.id} style={{ marginTop: 10 }}>{p.image_url && <img className="thumb" src={p.image_url} alt="" />}<span style={{ flex: 1 }}>{p.name}{p.store_name ? ` (${p.store_name})` : ''} · {rp(p.price)} · stok {p.stock}</span>
        <label className="btn sm">Ganti foto<input type="file" hidden accept="image/*" onChange={x => withUp(x.target.files?.[0] || null, 'product', url => run({ action: 'setProductImage', id: p.id, url }))} /></label>
        <button className="ghost sm" onClick={() => confirm('Hapus produk dan stoknya?') && run({ action: 'deleteProduct', id: p.id })}>Hapus</button></div>)}</F>
    <F title="Tambah stok (satu baris = satu stok)"><select {...s('sp')}><option value="">Pilih produk</option>{ps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <textarea rows={5} placeholder={'email1@mail.com : password : catatan\nemail2@mail.com : password : catatan'} {...s('sd')} /><button onClick={() => run({ action: 'addStock', product_id: f.sp, data: f.sd })}>Tambah stok</button></F>
    <F title="Voucher potongan (rupiah)"><input placeholder="Kode" {...s('vc')} /><input placeholder="Potongan (angka)" {...s('va')} /><button onClick={() => run({ action: 'addVoucher', code: f.vc, amount: f.va })}>Tambah voucher</button>
      {vs.map(v => <p key={v.code}>{v.code} · {rp(v.amount)} <button className="ghost sm" onClick={() => run({ action: 'deleteVoucher', code: v.code })}>Hapus</button></p>)}</F>
    <F title="Pengumuman"><textarea rows={2} {...s('at')} /><button onClick={() => run({ action: 'addAnnouncement', text: f.at })}>Tambah pengumuman</button>
      {an.map(a => <p key={a.id}>{a.text} <button className="ghost sm" onClick={() => run({ action: 'deleteAnnouncement', id: a.id })}>Hapus</button></p>)}</F>
    <F title="Poster beranda (gambar lanskap dari galeri)"><input type="file" accept="image/*" onChange={x => setPof(x.target.files?.[0] || null)} />
      <button disabled={!pof} onClick={() => withUp(pof, 'poster', async url => { await run({ action: 'addPoster', url }); setPof(null) })}>Tambah poster</button>
      {po.map(p => <div className="row" key={p.id} style={{ marginTop: 10 }}><img src={p.image_url} height={50} alt="" style={{ borderRadius: 8 }} /><span style={{ flex: 1 }} /><button className="ghost sm" onClick={() => run({ action: 'deletePoster', id: p.id })}>Hapus</button></div>)}</F>
    <F title="Saldo member"><input placeholder="Email member" {...s('be')} /><input placeholder="Jumlah (angka)" {...s('ba')} />
      <div className="row"><button onClick={() => run({ action: 'changeBalance', email: f.be, amount: Math.abs(+f.ba) })}>Tambah saldo</button><button className="ghost" onClick={() => run({ action: 'changeBalance', email: f.be, amount: -Math.abs(+f.ba) })}>Kurangi saldo</button></div></F></>}</>
}
