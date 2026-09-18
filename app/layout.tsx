import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginRequiredModalProvider } from '@/components/auth/LoginRequiredModalProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import './globals.css'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'TwistFit — Màu Sắc Cá Nhân & Phối Đồ Thông Minh',
  description:
    'TwistFit giúp bạn khám phá màu sắc cá nhân của chính mình và phối đồ thông minh bằng AI.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={`${montserrat.variable} antialiased`}>
      <head>
        {/* Material Symbols isn't available via next/font/google; this stylesheet link is the documented way to load it. */}
        {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface text-on-surface">
        <NextIntlClientProvider>
          <AuthProvider>
            <QrModalProvider>
              <LoginRequiredModalProvider>
                <Header />
                {children}
                <Footer />
              </LoginRequiredModalProvider>
            </QrModalProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
