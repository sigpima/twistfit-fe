'use client'

import { useTranslations } from 'next-intl'

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

        <div className="rounded-xl bg-surface-container-lowest p-space-xl shadow-sm">
          <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
            {t('missionLabel')}
          </span>
          <h3 className="mb-space-md mt-space-xs text-headline-md text-on-surface">{t('missionHeading')}</h3>
          <p className="mb-space-md text-headline-sm font-serif italic text-secondary">{t('missionQuote')}</p>
          <div className="flex max-w-prose flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
            <p>{t('missionParagraph1')}</p>
            <p>{t('missionParagraph2')}</p>
            <p>{t('missionParagraph3')}</p>
          </div>
        </div>

        <div className="mt-space-lg rounded-xl bg-gradient-to-br from-primary-container to-primary p-space-xl text-on-primary shadow-md">
          <span className="text-label-sm font-semibold uppercase tracking-widest text-primary-fixed">
            {t('visionLabel')}
          </span>
          <h3 className="mb-space-sm mt-space-xs text-headline-md text-on-primary">{t('visionHeading')}</h3>
          <p className="max-w-prose text-body-md leading-relaxed text-primary-fixed">{t('visionBody')}</p>
        </div>
      </div>
    </section>
  )
}
