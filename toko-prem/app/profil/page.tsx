'use client'
import { sb } from '@/lib/client'
import { Icon, useProfile } from '@/lib/ui'
export default function Profil() {
  const p = useProfile()
  if (p === undefined) return <p className="mute">Memuat...</p>
  if (!p) return <><h2>Profil</h2><div className="card"><p className="mute">Masuk untuk melihat profil dan pesananmu.</p><a className="btn" href="/login">Masuk atau daftar</a></div></>
  return <><h2>Profil</h2><div className="card"><div className="row"><div className="avatar"><Icon n="user" /></div><div style={{ flex: 1 }}><b>{p.name || 'Member'}</b><div className="mute">{p.email}</div>{p.role === 'admin' && <span className="pill g">Admin</span>}</div></div></div>
    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
      {p.role === 'admin' && <a className="btn" href="/admin">Buka admin panel</a>}
      <a className="btn" href="/merchant">Merchant: ajukan atau buka dashboard</a>
      <a className="btn" href="/riwayat">Riwayat pesanan</a>
      <button className="ghost" onClick={async () => { await sb.auth.signOut(); location.href = '/' }}>Keluar</button></div></>
}
