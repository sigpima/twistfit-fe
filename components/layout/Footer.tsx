'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

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
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@twistfit06',
    path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.97-4.52V8.4a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.97.17z',
  },
  {
    label: 'Email',
    href: 'mailto:twistfit.official@gmail.com',
    path: 'M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z',
  },
  // {
  //   label: 'Pinterest',
  //   path: 'M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z',
  // },
  // {
  //   label: 'YouTube',
  //   path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  // },
]

export default function Footer() {
  const t = useTranslations('Footer')

  return (
    <footer className="mt-8 w-full border-t border-[#e2e8f0] bg-white pb-8 pt-14 sm:mt-20">
      <div className="mx-auto max-w-7xl px-margin md:px-margin-desktop">
        <div className="grid grid-cols-1 gap-10 border-b border-[#f1f5f9] pb-12 md:grid-cols-4">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-black tracking-tight text-[#304461]">{t('brand')}</h2>
            <p className="text-xs italic text-[#7b89ba]">{t('tagline')}</p>
            <p className="text-xs leading-relaxed text-[#64748b]">{t('description')}</p>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">
              {t('featuresHeading')}
            </h3>
            <ul className="space-y-2.5 text-xs text-[#64748b]">
              <li>
                <a href="/personal-color/quiz" className="transition-colors hover:text-[#304461]">
                  {t('features.colorTest')}
                </a>
              </li>
              <li>
                <a href="/outfit/step-1" className="transition-colors hover:text-[#304461]">
                  {t('features.virtualFitting')}
                </a>
              </li>
              {/* <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  {t('features.outfitByBodyShape')}
                </a>
              </li> */}
              {/* <li>
                <a href="/forum" className="transition-colors hover:text-[#304461]">
                  {t('features.newsletter')}
                </a>
              </li> */}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">
              {t('supportHeading')}
            </h3>
            <ul className="space-y-2.5 text-xs text-[#64748b]">
              <li>
                <Link href="/about" className="transition-colors hover:text-[#304461]">
                  {t('support.about')}
                </Link>
              </li>
              <li>
                <Link href="/blog#faq" className="transition-colors hover:text-[#304461]">
                  {t('support.faq')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-[#304461]">
                  {t('support.blog')}
                </Link>
              </li>
              {/* <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  {t('support.privacy')}
                </a>
              </li> */}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">
              {t('contactHeading')}
            </h3>
            <ul className="mb-5 space-y-2.5 text-xs text-[#64748b]">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7b89ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>{t('email')}</span>
              </li>
              {/* <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7b89ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>{t('hotline')}</span>
              </li> */}
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7b89ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t('address')}</span>
              </li>
            </ul>
            <div className="flex items-center gap-3 text-[#7b89ba]">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f3ff] transition-colors hover:bg-[#7b89ba] hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-[#94a3b8] md:flex-row">
          <p>{t('copyright')}</p>
          <p>{t('copyrightSecondary')}</p>
        </div>
      </div>
    </footer>
  )
}
