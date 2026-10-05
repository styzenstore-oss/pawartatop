import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const err = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s })
export async function authUser(req: Request) {
  const t = req.headers.get('authorization')?.replace('Bearer ', ''); if (!t) return null
  const { data } = await db.auth.getUser(t); return data.user
}
export async function isAdmin(uid: string) {
  const { data } = await db.from('profiles').select('role').eq('id', uid).single(); return data?.role === 'admin'
}
