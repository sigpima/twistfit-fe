'use client'

import { useTranslations } from 'next-intl'

export default function StorySection() {
  const t = useTranslations('About.StorySection')

  return (
    <section className="w-full bg-surface-container-low/50 px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-6">
            <div className="inline-flex items-center gap-space-xs">
              <span className="h-px w-8 bg-secondary" />
              <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
                {t('kicker')}
              </span>
            </div>
            <h2 className="text-headline-lg leading-snug text-on-surface">{t('heading')}</h2>
            <div className="flex max-w-prose flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
              <p>{t('paragraph1')}</p>
              <p>{t('paragraph2')}</p>
            </div>
          </div>
          <div className="relative flex flex-col items-center lg:col-span-6">
            <div className="relative aspect-[4/5] w-full max-w-lg overflow-hidden rounded-xl shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/about/story-draping.jpg" alt={t('imageAlt')} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent" />
              <div className="absolute inset-x-space-md bottom-space-md text-inverse-on-surface">
                <span className="text-label-sm uppercase tracking-wider text-secondary-container">
                  {t('imageCaptionLabel')}
                </span>
                <p className="text-headline-sm font-semibold">{t('imageCaptionTitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
