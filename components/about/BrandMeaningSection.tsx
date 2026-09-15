'use client'

import { useTranslations } from 'next-intl'
import ContrastCardPair from './ContrastCardPair'

export default function BrandMeaningSection() {
  const t = useTranslations('About.BrandMeaning')

  return (
    <section className="w-full px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-space-xl inline-flex items-center gap-space-xs">
          <span className="h-px w-8 bg-secondary" />
          <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
            {t('kicker')}
          </span>
        </div>

        <div className="flex flex-col gap-space-lg">
          <h3 className="text-headline-md text-on-surface">{t('name.heading')}</h3>
          <p className="max-w-prose text-body-md leading-relaxed text-on-surface-variant">{t('name.intro')}</p>
          <ContrastCardPair
            left={{ title: t('name.twist.title'), body: t('name.twist.body'), accentClassName: 'text-primary' }}
            right={{ title: t('name.fit.title'), body: t('name.fit.body'), accentClassName: 'text-secondary' }}
          />
          <p className="max-w-prose text-body-md leading-relaxed text-on-surface-variant">{t('name.closing')}</p>
        </div>

        <div className="mt-space-xl flex flex-col gap-space-lg">
          <h3 className="text-headline-md text-on-surface">{t('symbol.heading')}</h3>
          <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
            <div className="lg:col-span-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/logo.png" alt={t('symbol.logoAlt')} className="mx-auto w-full max-w-xs" />
            </div>
            <p className="max-w-prose text-body-md leading-relaxed text-on-surface-variant lg:col-span-8">
              {t('symbol.intro')}
            </p>
          </div>

          <h4 className="text-headline-sm text-on-surface">{t('symbol.movementHeading')}</h4>
          <ContrastCardPair
            left={{
              title: t('symbol.static.title'),
              body: t('symbol.static.body'),
              accentClassName: 'text-tertiary',
            }}
            right={{
              title: t('symbol.dynamic.title'),
              body: t('symbol.dynamic.body'),
              accentClassName: 'text-secondary',
            }}
          />
          <p className="max-w-prose text-body-md leading-relaxed text-on-surface-variant">
            {t('symbol.layeringNote')}
          </p>

          <h4 className="text-headline-sm text-on-surface">{t('symbol.colorHeading')}</h4>
          <ContrastCardPair
            left={{
              title: t('symbol.vintage.title'),
              body: t('symbol.vintage.body'),
              accentClassName: 'text-tertiary',
              containerClassName: 'bg-tertiary-fixed',
            }}
            right={{
              title: t('symbol.modern.title'),
              body: t('symbol.modern.body'),
              accentClassName: 'text-secondary',
              containerClassName: 'bg-secondary-container',
            }}
          />
        </div>
      </div>
    </section>
  )
}
