'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function CtaBanner() {
  const t = useTranslations('HowItWorks.CtaBanner')

  return (
    <section className="w-full px-margin py-space-xl sm:px-margin-desktop lg:py-24">
      <div className="relative mx-auto flex max-w-5xl flex-col items-center overflow-hidden rounded-[36px] bg-gradient-to-r from-primary-fixed/60 via-secondary-container/50 to-surface-container p-space-xl text-center shadow-xl lg:p-16">
        <span className="mb-space-md inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-md py-1 text-label-sm font-bold uppercase text-primary shadow-sm">
          {t('badge')}
        </span>
        <h2 className="max-w-3xl text-display-lg font-bold leading-snug text-on-surface">{t('heading')}</h2>
        <p className="mt-space-md max-w-2xl text-body-lg leading-relaxed text-on-surface-variant">
          {t('subheading')}
        </p>
        <div className="z-10 mt-space-xl flex flex-wrap items-center justify-center gap-space-md">
          <Link
            href="/personal-color/quiz"
            className="inline-flex transform items-center gap-space-xs rounded-full bg-primary px-space-xl py-4 text-label-lg text-on-primary shadow-lg transition-all duration-300 hover:scale-105 hover:bg-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            <span>{t('primaryCta')}</span>
          </Link>
          <Link
            href="/outfit/step-1"
            className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-xl py-4 text-label-lg text-on-surface shadow-md transition-all duration-300 hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary">styler</span>
            <span>{t('secondaryCta')}</span>
          </Link>
        </div>
        <div className="mt-space-lg flex items-center justify-center gap-space-md text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>{' '}
            {t('trust1')}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">lock</span> {t('trust2')}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-emerald-600">speed</span> {t('trust3')}
          </span>
        </div>
      </div>
    </section>
  )
}
