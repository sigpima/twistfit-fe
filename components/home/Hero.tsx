'use client'

import { useTranslations } from 'next-intl'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'
import HeroSlideshow from './HeroSlideshow'
import { HERO_SLIDESHOW_MOBILE_IMAGES, HERO_SLIDESHOW_DESKTOP_WIDE_IMAGES } from '@/lib/heroSlideshowImages'

const BENEFIT_KEYS = ['outfitTransform', 'personalColor', 'community'] as const

export default function Hero() {
  const t = useTranslations('Home.Hero')
  const { openQrModal } = useQrModal()

  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0 lg:hidden">
        <HeroSlideshow images={HERO_SLIDESHOW_MOBILE_IMAGES} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/90" />
      </div>
      <div className="absolute inset-0 hidden lg:block">
        <HeroSlideshow images={HERO_SLIDESHOW_DESKTOP_WIDE_IMAGES} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl px-margin-desktop py-space-xl lg:min-h-[720px] lg:items-center lg:justify-center lg:py-24">
        <div className="flex w-full flex-col items-start space-y-6 lg:w-auto lg:max-w-3xl lg:items-center lg:text-center">
          <span className="text-label-sm font-bold uppercase tracking-[0.2em] text-white lg:text-label-lg">
            {t('tagline')}
          </span>
          <h1 className="text-display-lg-mobile tracking-tight text-white lg:text-6xl lg:leading-[1.05]">
            {t('heading')}
          </h1>
          <ul className="flex flex-col gap-space-sm lg:text-left">
            {BENEFIT_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-space-sm">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-on-surface">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </span>
                <span className="text-body-md text-white/90 lg:text-lg">{t(`benefits.${key}`)}</span>
              </li>
            ))}
          </ul>
            {/* <div className="flex w-full flex-wrap items-center gap-space-md pt-2 sm:w-auto">
              <button
                type="button"
                onClick={openQrModal}
                className="flex flex-1 transform items-center justify-center gap-space-sm rounded-full bg-primary px-7 py-3.5 text-label-lg text-on-primary shadow-[0_8px_20px_rgba(76,90,136,0.25)] transition-all hover:-translate-y-0.5 hover:bg-primary-container sm:flex-none"
              >
                <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                <span>{t('ctaPrimary')}</span>
              </button>
              <a
                href="#features-section"
                className="flex flex-1 items-center justify-center gap-space-sm rounded-full bg-surface-container px-7 py-3.5 text-label-lg text-on-surface transition-all hover:bg-surface-container-high sm:flex-none"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">checkroom</span>
                <span>{t('ctaSecondary')}</span>
              </a>
            </div>
            <div className="flex items-center gap-8 pt-6">
              <div className="flex -space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-label-md font-bold text-primary shadow-sm">
                  {t('avatarInitials.one')}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-label-md font-bold text-secondary shadow-sm">
                  {t('avatarInitials.two')}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed text-label-md font-bold text-tertiary shadow-sm">
                  {t('avatarInitials.three')}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-label-sm font-bold text-primary shadow-sm">
                  {t('avatarInitials.more')}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[#eab308]">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star_half
                  </span>
                  <span className="ml-1 text-label-md font-bold text-white lg:text-on-surface">{t('rating')}</span>
                </div>
                <p className="mt-0.5 text-body-sm text-white/80 lg:text-on-surface-variant">{t('ratingCaption')}</p>
              </div>
            </div> */}
        </div>
      </div>
    </section>
  )
}
