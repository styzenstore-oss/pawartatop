import { NextResponse } from 'next/server'
// Buka /api/version untuk memastikan kode terbaru yang aktif dan env sudah terisi (hanya true/false, nilai tidak ditampilkan)
export async function GET() {
  const ref = 'INV' + Date.now().toString(36).toUpperCase() + 'ABCD'
  return NextResponse.json({ version: 'v5-merchant', refContoh: ref, panjangRef: ref.length, env: { supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY, stenlySecret: !!process.env.STENLY_SECRET_KEY, stenlyWebhook: !!process.env.STENLY_WEBHOOK_SECRET } })
}
