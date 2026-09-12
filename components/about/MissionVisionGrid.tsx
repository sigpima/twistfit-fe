'use client'

import { useTranslations } from 'next-intl'

const CORE_VALUES = [
  { icon: 'fingerprint', iconBg: 'bg-secondary-fixed text-on-secondary-fixed', tagColor: 'text-secondary', key: 'personalization' },
  { icon: 'science', iconBg: 'bg-primary-fixed text-on-primary-fixed', tagColor: 'text-primary', key: 'science' },
  { icon: 'all_inclusive', iconBg: 'bg-tertiary-fixed text-on-tertiary-fixed', tagColor: 'text-tertiary', key: 'sustainability' },
] as const

export default function MissionVisionGrid() {
  const t = useTranslations('About.MissionVisionGrid')

  return (
    <section className="w-full px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-space-xl flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
          <div>
            <span className="text-label-sm font-semibold uppercase tracking-wider text-secondary">
              {t('kicker')}
            </span>
            <h2 className="mt-space-xs text-headline-lg text-on-surface">{t('heading')}</h2>
          </div>
          <p className="max-w-md text-body-md text-on-surface-variant">{t('introText')}</p>
        </div>
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-6">
            <div className="relative z-10">
              <div className="mb-space-lg flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                <span className="material-symbols-outlined text-[26px]">lightbulb</span>
              </div>
              <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
                {t('missionLabel')}
              </span>
              <h3 className="mb-space-md mt-space-xs text-headline-md text-on-surface">{t('missionTitle')}</h3>
              <p className="text-body-md leading-relaxed text-on-surface-variant">
                {t.rich('missionBody', {
                  bold: (chunks) => <span className="font-semibold text-secondary">{chunks}</span>,
                })}
              </p>
            </div>
            <div className="relative z-10 mt-space-lg flex items-center gap-space-md rounded-lg bg-surface-container-low/60 p-space-md">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-primary">
                <span className="material-symbols-outlined text-[20px]">savings</span>
              </div>
              <p className="text-body-sm text-on-surface">{t('missionFooterNote')}</p>
            </div>
          </div>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-primary-container to-primary p-space-xl text-on-primary shadow-md lg:col-span-6">
            <div className="relative z-10">
              <div className="mb-space-lg flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-lowest/20 text-on-primary backdrop-blur-md">
                <span className="material-symbols-outlined text-[26px]">visibility</span>
              </div>
              <span className="text-label-sm font-semibold uppercase tracking-widest text-primary-fixed">
                {t('visionLabel')}
              </span>
              <h3 className="mb-space-md mt-space-xs text-headline-md text-on-primary">{t('visionTitle')}</h3>
              <p className="text-body-md leading-relaxed text-primary-fixed">{t('visionBody')}</p>
            </div>
            <div className="relative z-10 mt-space-lg flex items-center justify-between rounded-lg bg-surface-container-lowest/10 p-space-md backdrop-blur-md">
              <div>
                <span className="block text-label-sm uppercase text-primary-fixed">{t('visionFooterLabel')}</span>
                <span className="text-label-lg font-semibold text-on-primary">{t('visionFooterValue')}</span>
              </div>
              <div className="flex items-center gap-space-xs text-primary-fixed">
                <span className="material-symbols-outlined text-[20px]">eco</span>
                <span className="text-label-md font-semibold">{t('visionFooterTag')}</span>
              </div>
            </div>
          </div>
          {CORE_VALUES.map((value) => (
            <div
              key={value.key}
              className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md lg:col-span-4"
            >
              <div className={`mb-space-md flex h-10 w-10 items-center justify-center rounded-full ${value.iconBg}`}>
                <span className="material-symbols-outlined text-[20px]">{value.icon}</span>
              </div>
              <h4 className="mb-space-xs text-headline-sm text-on-surface">{t(`coreValues.${value.key}.title`)}</h4>
              <p className={`mb-space-xs text-label-sm font-semibold uppercase tracking-wider ${value.tagColor}`}>
                {t(`coreValues.${value.key}.tag`)}
              </p>
              <p className="text-body-sm leading-relaxed text-on-surface-variant">
                {t(`coreValues.${value.key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
