import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { SITE_URL } from '@/lib/site'
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/jsonLd'
import { QrModalProvider } from '@/components/qr-modal/QrModalProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginRequiredModalProvider } from '@/components/auth/LoginRequiredModalProvider'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import JsonLd from '@/components/seo/JsonLd'
import MaterialSymbolsStylesheet from '@/components/seo/MaterialSymbolsStylesheet'
import './globals.css'

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'TwistFit — Màu Sắc Cá Nhân & Phối Đồ Thông Minh',
  description:
    'TwistFit giúp bạn khám phá màu sắc cá nhân của chính mình và phối đồ thông minh bằng AI.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={`${montserrat.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <MaterialSymbolsStylesheet />
        <JsonLd data={buildOrganizationJsonLd()} />
        <JsonLd data={buildWebsiteJsonLd()} />
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
      {/* Unset in local dev on purpose — only set NEXT_PUBLIC_GA_ID in production, so local
          testing never sends real analytics events. Loaded with strategy="lazyOnload"
          (rather than @next/third-parties' GoogleAnalytics, which uses "afterInteractive")
          so the ~170 KiB gtag.js bundle downloads after the page is idle instead of
          competing with the initial page load. */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script id="ga-init" strategy="lazyOnload">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`}
          </Script>
          <Script
            id="ga-src"
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          />
        </>
      )}
    </html>
  )
}
