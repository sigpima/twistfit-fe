'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

const METRICS = [
  { key: 'spectrumPoints', color: 'text-primary' },
  { key: 'seasons', color: 'text-secondary' },
  { key: 'accuracy', color: 'text-primary' },
  { key: 'instantResult', color: 'text-tertiary' },
] as const

export default function HowItWorksHero() {
  const t = useTranslations('HowItWorks.Hero')

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-surface via-surface-container-low/40 to-surface px-margin py-space-xl sm:px-margin-desktop lg:py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <div className="mb-space-md inline-flex items-center gap-space-xs rounded-full border border-surface-container-highest bg-surface-container px-space-md py-1.5 shadow-sm">
          <span className="material-symbols-outlined text-[18px] text-primary">biotech</span>
          <span className="text-label-sm font-bold uppercase tracking-wider text-primary">
            {t('badgeText')}
          </span>
        </div>
        <h1 className="max-w-4xl text-display-lg font-bold leading-tight tracking-tight text-on-surface">
          {t.rich('heading', {
            highlight: (chunks) => (
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                {chunks}
              </span>
            ),
          })}
        </h1>
        <p className="mt-space-md max-w-3xl text-body-lg leading-relaxed text-on-surface-variant">
          {t('subheading')}
        </p>
        <div className="mt-space-xl flex flex-wrap items-center justify-center gap-space-md">
          <Link
            href="/personal-color/quiz"
            className="inline-flex transform items-center gap-space-xs rounded-full bg-on-surface px-space-xl py-3.5 text-label-lg text-on-primary shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary"
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            <span>{t('primaryCta')}</span>
          </Link>
          <a
            href="#video-demo"
            className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-xl py-3.5 text-label-lg text-primary shadow-md transition-all duration-300 hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary">play_circle</span>
            <span>{t('secondaryCta')}</span>
          </a>
        </div>
        <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-space-md rounded-2xl bg-surface-container-lowest/80 p-space-md shadow-sm backdrop-blur-md md:grid-cols-4">
          {METRICS.map((metric) => (
            <div key={metric.key} className="flex flex-col items-center py-space-xs">
              <span className={`text-headline-md font-bold ${metric.color}`}>{t(`metrics.${metric.key}.value`)}</span>
              <span className="text-label-sm text-on-surface-variant">{t(`metrics.${metric.key}.label`)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
