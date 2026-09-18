'use client'

import { useTranslations } from 'next-intl'
import HeroSlideshow from '@/components/home/HeroSlideshow'
import { HERO_SLIDESHOW_MOBILE_IMAGES, HERO_SLIDESHOW_DESKTOP_WIDE_IMAGES } from '@/lib/heroSlideshowImages'

export default function AboutHero() {
  const t = useTranslations('About.Hero')

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
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start px-margin-desktop py-space-xl text-left lg:min-h-[640px] lg:justify-center lg:py-24">
        <h1 className="max-w-2xl text-display-lg leading-tight tracking-tight text-white">{t('heading')}</h1>
        <div className="mt-space-lg flex max-w-xl flex-col gap-space-md text-body-lg leading-relaxed text-white/90">
          <p>{t('subheadingIntro')}</p>
          <p>{t('subheadingTransition')}</p>
        </div>
      </div>
    </section>
  )
}
