import './globals.css'
import { Sora, Manrope } from 'next/font/google'
import Nav from './nav'
const head = Sora({ subsets: ['latin'], variable: '--font-head' })
const body = Manrope({ subsets: ['latin'], variable: '--font-body' })
export const metadata = { title: 'Toko Premium', description: 'Akun premium, dikirim otomatis setelah bayar' }
export default function L({ children }: any) { return <html lang="id" className={`${head.variable} ${body.variable}`}><body><Nav /><main>{children}</main></body></html> }
