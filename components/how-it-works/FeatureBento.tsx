'use client'

import { useTranslations } from 'next-intl'

export default function FeatureBento() {
  const t = useTranslations('HowItWorks.FeatureBento')

  return (
    <section className="bg-surface-container-low/50 px-margin py-space-xl sm:px-margin-desktop lg:py-24" id="video-demo">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-label-sm font-bold uppercase tracking-wider text-primary">{t('kicker')}</span>
          <h2 className="mt-1 text-headline-lg font-bold text-on-surface">{t('heading')}</h2>
          <p className="mt-space-xs text-body-md text-on-surface-variant">{t('subheading')}</p>
        </div>
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-3xl bg-surface-container-lowest p-space-lg shadow-md">
            <div>
              <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
              <h4 className="text-headline-sm font-bold text-on-surface">{t('card1.title')}</h4>
              <p className="mt-space-xs text-body-md text-on-surface-variant">{t('card1.body')}</p>
            </div>
            <div className="mt-space-lg flex items-center justify-around rounded-2xl bg-surface-container-low p-space-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1 shadow-xs">
                <span className="material-symbols-outlined text-[28px] text-primary">apparel</span>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1 shadow-xs">
                <span className="material-symbols-outlined text-[28px] text-secondary">styler</span>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1 shadow-xs">
                <span className="material-symbols-outlined text-[28px] text-tertiary">shopping_bag</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-3xl bg-surface-container-lowest p-space-lg shadow-md">
            <div>
              <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">tune</span>
              </div>
              <h4 className="text-headline-sm font-bold text-on-surface">{t('card2.title')}</h4>
              <p className="mt-space-xs text-body-md text-on-surface-variant">{t('card2.body')}</p>
            </div>
            <div className="mt-space-lg rounded-2xl bg-surface-container-low p-space-sm">
              <div className="mb-1 flex justify-between text-label-sm font-medium text-on-surface-variant">
                <span>{t('card2.contrastLabel')}</span>
                <span className="font-bold text-primary">{t('card2.contrastValue')}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full w-[88%] rounded-full bg-primary" />
              </div>
              <div className="mb-1 mt-3 flex justify-between text-label-sm font-medium text-on-surface-variant">
                <span>{t('card2.toneLabel')}</span>
                <span className="font-bold text-secondary">{t('card2.toneValue')}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full w-[92%] rounded-full bg-secondary" />
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-3xl bg-surface-container-lowest p-space-lg shadow-md">
            <div>
              <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed">
                <span className="material-symbols-outlined text-[24px]">calendar_month</span>
              </div>
              <h4 className="text-headline-sm font-bold text-on-surface">{t('card3.title')}</h4>
              <p className="mt-space-xs text-body-md text-on-surface-variant">{t('card3.body')}</p>
            </div>
            <div className="mt-space-lg flex items-center justify-between rounded-2xl bg-surface-container-low p-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[22px] text-secondary">wb_sunny</span>
                <span className="text-label-sm font-semibold text-on-surface">{t('card3.weatherLabel')}</span>
              </div>
              <span className="rounded-full bg-primary px-2.5 py-1 text-label-sm text-on-primary">
                {t('card3.suggestionBadge')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
