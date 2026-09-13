'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'

const NAV_LINKS = [
  { href: '/about', key: 'about' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/faq', key: 'faq' },
  { href: '/blog', key: 'blog' },
] as const

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'Instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'TikTok',
    path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.97-4.52V8.4a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.97.17z',
  },
  {
    label: 'Threads',
    path: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.47 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.78 3.63 2.694 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.36-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.332-3.088.886-.77 2.14-1.22 3.63-1.302a13.5 13.5 0 0 1 2.6.106c-.169-1.088-.575-1.926-1.212-2.494-.85-.759-2.062-1.14-3.6-1.14h-.028c-1.29.008-2.35.35-3.156 1.02l-1.634-1.542c1.166-1.081 2.706-1.647 4.57-1.68h.053c2.13 0 3.852.607 5.12 1.804 1.335 1.264 2.038 3.015 2.09 5.203a11.24 11.24 0 0 1 2.03 1.098c1.74 1.23 2.66 3.042 2.594 5.1-.069 2.122-1.048 3.983-2.833 5.39C17.11 23.264 14.929 23.98 12.2 24h-.014Z',
  },
] as const

export default function Header() {
  const t = useTranslations('Header')
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="flex h-9 w-full items-center justify-end gap-2 bg-[#fdc8e9] px-6">
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.label}
            href="#"
            aria-label={social.label}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#fdc8e9] transition-opacity hover:opacity-80"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d={social.path} />
            </svg>
          </a>
        ))}
      </div>

      <div className="w-full border-b border-[#e2e8f0]/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/logo.png" alt="TwistFit Logo" className="h-12 w-auto object-contain" />
          </Link>

          <div className="flex flex-col items-end gap-3">
            {user ? (
              <button
                type="button"
                onClick={logout}
                aria-label={`${t('accountAriaLabel')} — ${user.name} (${t('logout')})`}
                title={`${user.name} — ${t('logout')}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7b89ba] text-white shadow-sm ring-2 ring-[#7b89ba]/30 transition-colors hover:bg-[#6875a6]"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full border border-[#7b89ba] px-5 py-2.5 text-xs font-semibold text-[#7b89ba] transition-colors hover:bg-[#7b89ba]/10"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-[#7b89ba] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#6875a6]"
                >
                  {t('register')}
                </Link>
              </div>
            )}

            <nav className="hidden items-center gap-2 md:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full bg-[#fdc8e9]/40 px-5 py-2 text-sm font-medium text-[#304461] transition-colors hover:bg-[#fdc8e9]/70"
                >
                  {t(`nav.${link.key}`)}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="h-1.5 w-full bg-[#304461]" />
    </header>
  )
}
