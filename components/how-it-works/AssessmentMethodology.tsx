'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

const PHASES = [
  {
    key: 'hue',
    methodKeys: ['veins', 'jewelry', 'fitzpatrick', 'drapery'],
    icons: { veins: 'water_drop', jewelry: 'diamond', fitzpatrick: 'wb_sunny', drapery: 'checkroom' },
  },
  {
    key: 'value',
    methodKeys: ['eyesHair', 'contrastLevel', 'colorFormula'],
    icons: { eyesHair: 'visibility', contrastLevel: 'contrast', colorFormula: 'palette' },
  },
  {
    key: 'chroma',
    methodKeys: ['sparkleTest', 'triangulation', 'lockResult'],
    icons: { sparkleTest: 'auto_awesome', triangulation: 'hub', lockResult: 'verified' },
  },
] as const

export default function AssessmentMethodology() {
  const t = useTranslations('HowItWorks.AssessmentMethodology')
  const [activeIndex, setActiveIndex] = useState(0)
  const activePhase = PHASES[activeIndex]

  return (
    <div className="mb-20">
      <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-headline-sm font-bold text-on-secondary-fixed shadow-sm">
        01
      </div>
      <h3 className="text-headline-md font-bold text-on-surface">{t('title')}</h3>
      <p className="mt-space-sm max-w-prose text-body-lg leading-relaxed text-on-surface-variant">
        {t('intro')}
      </p>

      <div className="mt-space-lg flex flex-wrap gap-space-sm">
        {PHASES.map((phase, index) => (
          <button
            key={phase.key}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-current={index === activeIndex ? 'true' : undefined}
            className={`rounded-full px-space-lg py-space-sm text-label-lg font-semibold transition-colors ${
              index === activeIndex
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {t(`phases.${phase.key}.tabLabel`)}
          </button>
        ))}
      </div>

      <h4 className="mt-space-lg text-headline-sm font-bold text-on-surface">
        {t(`phases.${activePhase.key}.title`)}
      </h4>
      <p className="mt-space-xs max-w-prose text-body-md leading-relaxed text-on-surface-variant">
        {t(`phases.${activePhase.key}.intro`)}
      </p>

      <div className="mt-space-md grid grid-cols-1 gap-space-md md:grid-cols-2">
        {activePhase.methodKeys.map((methodKey) => (
          <div key={methodKey} className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <span className="material-symbols-outlined text-[24px] text-secondary">
              {(activePhase.icons as Record<string, string>)[methodKey]}
            </span>
            <h5 className="mt-space-xs text-label-lg font-bold text-on-surface">
              {t(`phases.${activePhase.key}.methods.${methodKey}.title` as Parameters<typeof t>[0])}
            </h5>
            <p className="mt-space-xs text-body-sm text-on-surface-variant">
              {t(`phases.${activePhase.key}.methods.${methodKey}.body` as Parameters<typeof t>[0])}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
