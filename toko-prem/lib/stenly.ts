// Integrasi StenlyPay (https://stenly.id/docs). Auth: header x-api-key (secret key, server only).
const base = 'https://stenly.id/api/v1'
const h = () => ({ 'Content-Type': 'application/json', 'x-api-key': process.env.STENLY_SECRET_KEY! })
export async function createQris(orderId: string, amount: number, name?: string, phone?: string) {
  const r = await fetch(`${base}/charge`, { method: 'POST', headers: h(), body: JSON.stringify({ order_id: orderId, gross_amount: amount, customer_name: name, customer_phone: phone || undefined, expiry_minutes: 15 }) })
  const j = await r.json(); if (!r.ok) throw new Error(j.message || 'Gateway error')
  return { ref: String(j.data.order_id), qr: String(j.data.qr_string) } // qr_image_url sengaja tidak dipakai: memuat API key di URL
}
export async function getStatus(orderId: string): Promise<string> {
  const r = await fetch(`${base}/status/${encodeURIComponent(orderId)}`, { headers: h(), cache: 'no-store' }); const j = await r.json()
  return String(j.data?.status ?? '')
}
export async function isPaid(orderId: string) {
  return ['paid', 'paid_after_expiry', 'sandbox_trx_paid'].includes(await getStatus(orderId))
}
export async function cancelCharge(orderId: string) {
  await fetch(`${base}/cancel`, { method: 'POST', headers: h(), body: JSON.stringify({ order_id: orderId }) })
}
