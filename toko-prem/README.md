# Toko Premium (Next.js + Supabase + StenlyPay)
1. Buat project Supabase, jalankan `supabase/schema.sql` di SQL Editor.
2. Salin `.env.example` ke `.env.local`, isi semua nilai (mulai dengan key sandbox `sk_test_`).
3. `npm install && npm run dev`. Daftar akun, lalu jadikan admin: `update profiles set role='admin' where email='emailkamu';`
4. Di dashboard stenly.id, isi Callback URL project: `https://domainmu/api/webhook`.
5. Tes alur di sandbox (POST /api/v1/simulate-pay), baru ganti ke `sk_live_`.
6. Upload ke GitHub, deploy ke Vercel (isi env yang sama di Vercel).

## Urutan SQL (instalasi baru)
`schema.sql` lalu `migrasi-v5.sql`. Untuk database lama: `migrasi-v4.sql` lalu `migrasi-v5.sql`.
