'use client'
import { useState } from 'react'
import { sb } from '@/lib/client'
import { Icon } from '@/lib/ui'
export default function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('in'), [f, setF] = useState({ name: '', email: '', pw: '' }), [e, setE] = useState('')
  const go = async () => {
    setE(''); const r = mode === 'in' ? await sb.auth.signInWithPassword({ email: f.email, password: f.pw }) : await sb.auth.signUp({ email: f.email, password: f.pw, options: { data: { name: f.name } } })
    if (r.error) return setE(r.error.message); location.href = '/'
  }
  return <div className="card" style={{ maxWidth: 400, margin: '20px auto' }}><div className="avatar" style={{ marginBottom: 12 }}><Icon n="user" /></div><h2 style={{ margin: '0 0 12px' }}>{mode === 'in' ? 'Masuk ke akun' : 'Buat akun baru'}</h2>
    {mode === 'up' && <input placeholder="Nama" value={f.name} onChange={x => setF({ ...f, name: x.target.value })} />}
    <input placeholder="Email" type="email" value={f.email} onChange={x => setF({ ...f, email: x.target.value })} />
    <input placeholder="Password (min. 6 karakter)" type="password" value={f.pw} onChange={x => setF({ ...f, pw: x.target.value })} />
    {e && <p className="err">{e}</p>}<button style={{ width: '100%' }} onClick={go}>{mode === 'in' ? 'Masuk' : 'Daftar'}</button>
    <p style={{ textAlign: 'center' }}><button className="ghost sm" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button></p></div>
}
