import { NextResponse } from 'next/server'
import { db, err, authUser } from '@/lib/server'
import { isPaid } from '@/lib/stenly'
async function hGET(req: Request) {
  const u = await authUser(req); if (!u) return err('Login dulu', 401)
  const { data: pend } = await db.from('orders').select('id,gateway_ref').eq('user_id', u.id).eq('status', 'pending')
  for (const o of pend || []) if (o.gateway_ref && await isPaid(o.gateway_ref)) await db.rpc('fulfill_order', { oid: o.id })
  const { data } = await db.from('orders').select('*').eq('user_id', u.id).order('created_at', { ascending: false }).limit(50)
  const now = Date.now()
  return NextResponse.json((data || []).map(o => {
    const expired = o.status === 'paid' && new Date(o.expires_at).getTime() < now
    const late = o.status === 'pending' && now - new Date(o.created_at).getTime() > 20 * 60000 // QRIS berlaku 15 menit
    return { id: o.id, ref: o.gateway_ref, total: o.total, items: o.items, status: expired ? 'expired' : late ? 'late' : o.status, qris: o.status === 'pending' && !late ? o.qris : null, delivered: o.status === 'paid' && !expired ? o.delivered : null, expires_at: o.expires_at, created_at: o.created_at }
  }))
}
export async function GET(req: Request) { try { return await hGET(req) } catch (e: any) { return err('Server error: ' + e.message, 500) } }
