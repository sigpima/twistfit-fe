'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import FeatureSection from './FeatureSection'
import type { FeatureKey } from '@/lib/featureShowcaseSteps'

const FEATURES: { key: FeatureKey; accentClassName: string }[] = [
  { key: 'colorTest', accentClassName: 'text-secondary' },
  { key: 'outfit', accentClassName: 'text-primary' },
]

export default function FeatureShowcase() {
  const t = useTranslations('Home.FeatureShowcase')
  const [activeIndex, setActiveIndex] = useState(0)

  const active = FEATURES[activeIndex]
  const ctaByFeature: Record<FeatureKey, { label: string; onClick?: () => void; href?: string }> = {
    colorTest: { label: t('features.colorTest.cta'), href: '/personal-color/quiz' },
    outfit: { label: t('features.outfit.cta'), href: '/outfit/step-1' },
  }

  function goToPrevious() {
    setActiveIndex((current) => (current - 1 + FEATURES.length) % FEATURES.length)
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % FEATURES.length)
  }

  return (
    <section id="features-section" className="w-full bg-surface-container-lowest/60 py-space-xl">
      <div className="mx-auto max-w-7xl px-margin-desktop">
        <div className="mx-auto mb-16 flex max-w-3xl flex-col items-center text-center">
          {/* <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary-fixed px-3.5 py-1 text-label-sm text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            <span>{t('badgePill')}</span>
          </div> */}
          <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
          <p className="mt-2 text-body-lg text-on-surface-variant">{t('subheading')}</p>
        </div>

        <FeatureSection featureKey={active.key} accentClassName={active.accentClassName} cta={ctaByFeature[active.key]} />

        <div className="mt-10 flex items-center justify-end gap-space-sm">
          <button
            type="button"
            onClick={goToPrevious}
            aria-label={t('prevAriaLabel')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              chevron_left
            </span>
          </button>
          <div className="flex items-center gap-2">
            {FEATURES.map((feature, index) => (
              <button
                key={feature.key}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-current={index === activeIndex ? 'true' : undefined}
                aria-label={t('viewFeatureAriaLabel', { title: t(`features.${feature.key}.title`) })}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === activeIndex ? 'bg-on-surface' : 'bg-surface-container-high hover:bg-surface-container-highest'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goToNext}
            aria-label={t('nextAriaLabel')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
