'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useLoginRequiredModal } from '@/components/auth/LoginRequiredModalProvider'

const FEATURE_LINKS = [
  { href: '/personal-color/quiz', key: 'personalColorTest' },
  { href: '/outfit/step-1', key: 'outfitStyling' },
  { href: '/forum', key: 'forum' },
] as const

const NAV_LINKS = [
  { href: '/about', key: 'about' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/faq', key: 'faq' },
  { href: '/blog', key: 'blog' },
] as const

const ACCOUNT_MENU_LINKS = [
  { href: '#', key: 'savedCollection' },
  { href: '/personal-color/result', key: 'personalColorResult' },
  { href: '#', key: 'profile' },
] as const

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: '#',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'Instagram',
    href: '#',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'TikTok',
    href: '#',
    path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.97-4.52V8.4a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.97.17z',
  },
  {
    label: 'Email',
    href: 'mailto:support@twistfit.vn',
    path: 'M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z',
  },
] as const

export default function Header() {
  const t = useTranslations('Header')
  const { user, logout } = useAuth()
  const { openLoginRequiredModal } = useLoginRequiredModal()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className={`flex h-11 w-full items-center justify-center transition-all duration-300 ${
          isScrolled ? 'bg-[#fdc8e9]/60 backdrop-blur-xl' : 'bg-[#fdc8e9]'
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3 px-margin md:px-margin-desktop">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#fdc8e9] shadow-sm transition-transform hover:scale-105 hover:opacity-90"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d={social.path} />
              </svg>
            </a>
          ))}
        </div>
      </div>

      <div
        className={`w-full border-b transition-all duration-300 ${
          isScrolled
            ? 'border-white/40 bg-[#fdf3d3]/60 shadow-lg backdrop-blur-xl'
            : 'border-[#f3e3b8] bg-[#fdf3d3]'
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-margin py-4 md:px-margin-desktop">
          <div className="flex min-w-0 items-center gap-8">
            <Link href="/" className="flex shrink-0 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/logo.png" alt="TwistFit Logo" className="h-25 w-auto object-contain" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <div className="group relative">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-[#3c4a63] transition-colors hover:bg-white/50"
                >
                  {t('featuresLabel')}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    expand_more
                  </span>
                </button>
                <div className="invisible absolute left-0 top-full z-20 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="w-56 rounded-2xl border border-[#f3e3b8] bg-white p-2 shadow-lg">
                    {FEATURE_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(event) => {
                          if (item.key === 'outfitStyling' && !user) {
                            event.preventDefault()
                            openLoginRequiredModal()
                          }
                        }}
                        className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#3c4a63] transition-colors hover:bg-[#fdf3d3]"
                      >
                        {t(`features.${item.key}`)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#3c4a63] transition-colors hover:bg-white/50"
                >
                  {t(`nav.${link.key}`)}
                </Link>
              ))}
            </nav>
          </div>

          {user ? (
            <div className="group relative shrink-0">
              <button
                type="button"
                aria-label={`${t('accountAriaLabel')} — ${user.name}`}
                title={user.name}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ec7fb8] text-white shadow-sm ring-2 ring-[#ec7fb8]/30 transition-colors hover:bg-[#e564a8]"
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
              <div className="invisible absolute right-0 top-full z-20 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="w-60 rounded-2xl border border-[#f3e3b8] bg-white p-2 shadow-lg">
                  <p className="truncate px-4 pb-2 pt-1 text-xs font-semibold text-[#94a3b8]">{user.name}</p>
                  {ACCOUNT_MENU_LINKS.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-[#3c4a63] transition-colors hover:bg-[#fdf3d3]"
                    >
                      {t(`accountMenu.${item.key}`)}
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-[#f1f5f9]" />
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-[#ec7fb8] transition-colors hover:bg-[#ec7fb8]/10"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      logout
                    </span>
                    {t('logout')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full border border-[#ec7fb8] px-5 py-2.5 text-sm font-semibold text-[#ec7fb8] transition-colors hover:bg-[#ec7fb8]/10"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  login
                </span>
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 rounded-full bg-[#ec7fb8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#e564a8]"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  person_add
                </span>
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
