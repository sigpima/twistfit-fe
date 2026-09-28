'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useLoginRequiredModal } from '@/components/auth/LoginRequiredModalProvider'

const FEATURE_LINKS = [
  { href: '/personal-color/quiz', key: 'personalColorTest' },
  { href: '/outfit/step-1', key: 'outfitStyling' },
] as const

const PRIMARY_NAV_LINKS = [{ href: '/about', key: 'about' }] as const

const SECONDARY_NAV_LINKS = [
  { href: '/forum', key: 'community' },
  { href: '/blog', key: 'blog' },
  { href: '/contact', key: 'contact' },
] as const

const ACCOUNT_MENU_LINKS = [
  { href: '/collection', key: 'savedCollection' },
  { href: '/personal-color/result', key: 'personalColorResult' },
  { href: '/profile', key: 'profile' },
] as const

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://web.facebook.com/profile.php?id=61594036813778',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'Threads',
    href: 'https://www.threads.com/@twistfit.official',
    path: 'M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z',
  },
  // {
  //   label: 'TikTok',
  //   href: 'https://www.tiktok.com/@twistfit06',
  //   path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.97-4.52V8.4a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.97.17z',
  // },
  {
    label: 'Email',
    href: 'mailto:twistfit.official@gmail.com',
    path: 'M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z',
  },
] as const

export default function Header() {
  const t = useTranslations('Header')
  const { user, logout } = useAuth()
  const { openLoginRequiredModal } = useLoginRequiredModal()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  function closeMobileMenu() {
    setIsMobileMenuOpen(false)
  }

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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-margin md:justify-end md:px-margin-desktop">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={t('menuAriaLabel')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#fdc8e9] shadow-sm transition-transform hover:scale-105 hover:opacity-90 md:hidden"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              menu
            </span>
          </button>
          <div className="flex items-center gap-3">
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
              <img src="/home/logo.png" alt="TwistFit Logo" className="h-12 w-auto object-contain sm:h-16 md:h-25" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {PRIMARY_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#3c4a63] transition-colors hover:bg-white/50"
                >
                  {t(`nav.${link.key}`)}
                </Link>
              ))}

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

              {SECONDARY_NAV_LINKS.map((link) => (
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
            <div className="flex shrink-0 items-center gap-2">
              {user.role === 'admin' && (
                <span className="hidden items-center gap-1 rounded-full bg-primary px-3 py-1 text-label-sm font-semibold text-on-primary sm:inline-flex">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    admin_panel_settings
                  </span>
                  {t('adminBadge')}
                </span>
              )}
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={isAccountMenuOpen}
                  aria-label={
                    user.role === 'admin'
                      ? `${t('accountAriaLabel')} — ${user.name} (${t('adminBadgeAriaSuffix')})`
                      : `${t('accountAriaLabel')} — ${user.name}`
                  }
                  title={user.name}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-[#ec7fb8] text-white shadow-sm ring-2 transition-colors hover:bg-[#e564a8] ${
                    user.role === 'admin' ? 'ring-primary/50' : 'ring-[#ec7fb8]/30'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {user.role === 'admin' && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-on-primary ring-2 ring-white"
                    >
                      <span className="material-symbols-outlined text-[11px]">admin_panel_settings</span>
                    </span>
                  )}
                </button>
                {isAccountMenuOpen && (
                  <div
                    aria-hidden="true"
                    data-testid="account-menu-overlay"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="fixed inset-0 z-10"
                  />
                )}
                <div
                  role="menu"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className={`absolute right-0 top-full z-20 pt-2 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
                    isAccountMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
                  }`}
                >
                  <div className="w-60 rounded-2xl border border-[#f3e3b8] bg-white p-2 shadow-lg">
                    <p className="truncate px-4 pb-2 pt-1 text-xs font-semibold text-[#94a3b8]">{user.name}</p>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="mb-1 flex items-center gap-2 rounded-xl bg-primary-fixed px-4 py-2.5 text-sm font-semibold text-on-primary-fixed transition-colors hover:bg-primary-fixed-dim"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          admin_panel_settings
                        </span>
                        {t('accountMenu.adminDashboard')}
                      </Link>
                    )}
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
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/login"
                aria-label={t('login')}
                className="flex items-center justify-center gap-1 rounded-full border border-[#ec7fb8] p-2.5 text-sm font-semibold text-[#ec7fb8] transition-colors hover:bg-[#ec7fb8]/10 sm:px-3.5 sm:py-2.5"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  login
                </span>
                <span className="hidden sm:inline">{t('login')}</span>
              </Link>
              <Link
                href="/register"
                aria-label={t('register')}
                className="flex items-center justify-center gap-1 rounded-full bg-[#ec7fb8] p-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#e564a8] sm:px-3.5 sm:py-2.5"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                  person_add
                </span>
                <span className="hidden sm:inline">{t('register')}</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div
        aria-hidden="true"
        onClick={closeMobileMenu}
        className={`fixed inset-0 z-40 bg-on-surface/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] transform flex-col bg-[#fdf3d3] shadow-2xl transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {isMobileMenuOpen && (
          <>
            <div className="flex items-center justify-between border-b border-[#f3e3b8] px-margin py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/logo.png" alt="TwistFit Logo" className="h-10 w-auto object-contain" />
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label={t('closeMenuAriaLabel')}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#3c4a63] transition-colors hover:bg-white/60"
              >
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto px-margin py-4">
              {PRIMARY_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#3c4a63] transition-colors hover:bg-white/60"
                >
                  {t(`nav.${link.key}`)}
                </Link>
              ))}

              <p className="mt-3 px-4 text-xs font-semibold uppercase tracking-wide text-[#94a3b8]">
                {t('featuresLabel')}
              </p>
              {FEATURE_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) => {
                    if (item.key === 'outfitStyling' && !user) {
                      event.preventDefault()
                      openLoginRequiredModal()
                    }
                    closeMobileMenu()
                  }}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#3c4a63] transition-colors hover:bg-white/60"
                >
                  {t(`features.${item.key}`)}
                </Link>
              ))}

              <div className="mt-3 flex flex-col gap-1">
                {SECONDARY_NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#3c4a63] transition-colors hover:bg-white/60"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                ))}
              </div>
            </nav>
          </>
        )}
      </div>
    </header>
  )
}
