import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/server'
import { isPaid } from '@/lib/stenly'
export async function POST(req: Request) {
  const raw = await req.text()
  const sig = req.headers.get('x-stenly-signature') || ''
  const exp = crypto.createHmac('sha256', process.env.STENLY_WEBHOOK_SECRET!).update(raw).digest('hex')
  const a = Buffer.from(sig), b = Buffer.from(exp)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ message: 'Invalid signature' }, { status: 401 })
  const d = JSON.parse(raw).data || {}
  // pembayaran ganda (-PAY2 dst) tidak cocok dengan order kita: dilewati, tinjau manual di dashboard stenly.id
  if (['paid', 'paid_after_expiry'].includes(d.status) && !d.is_duplicate_payment) {
    if (String(d.order_id).startsWith('TUP')) { // isi saldo
      const { data: t } = await db.from('topups').select('id,amount').eq('ref', d.order_id).eq('status', 'pending').maybeSingle()
      if (t && t.amount === d.gross_amount && await isPaid(d.order_id)) await db.rpc('fulfill_topup', { tid: t.id })
      return NextResponse.json({ received: true })
    }
    const { data: o } = await db.from('orders').select('id,total').eq('gateway_ref', d.order_id).eq('status', 'pending').maybeSingle()
    if (o && o.total === d.gross_amount && await isPaid(o.id)) await db.rpc('fulfill_order', { oid: o.id })
  }
  return NextResponse.json({ received: true })
}
