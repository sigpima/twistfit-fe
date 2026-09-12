'use client'

import { useTranslations } from 'next-intl'

const TIPS = [
  { icon: 'wb_sunny', iconBg: 'bg-secondary-container text-on-secondary-fixed', key: 'naturalLight' },
  { icon: 'photo_camera_front', iconBg: 'bg-primary-fixed text-on-primary-fixed', key: 'angle90' },
  { icon: 'face', iconBg: 'bg-tertiary-fixed text-on-tertiary-fixed', key: 'bareFace' },
  { icon: 'face_retouching_off', iconBg: 'bg-surface-container-highest text-primary', key: 'tieHair' },
] as const

export default function PreparationTips() {
  const t = useTranslations('HowItWorks.PreparationTips')

  return (
    <section className="bg-surface-container-low/40 px-margin py-space-xl sm:px-margin-desktop lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-label-sm font-bold uppercase tracking-wider text-primary">{t('kicker')}</span>
          <h2 className="mt-1 text-headline-lg font-bold text-on-surface">{t('heading')}</h2>
          <p className="mt-space-xs text-body-md text-on-surface-variant">{t('subheading')}</p>
        </div>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {TIPS.map((tip) => (
            <div
              key={tip.key}
              className="rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl ${tip.iconBg}`}>
                <span className="material-symbols-outlined text-[26px]">{tip.icon}</span>
              </div>
              <h4 className="text-headline-sm font-bold text-on-surface">{t(`tips.${tip.key}.title`)}</h4>
              <p className="mt-space-xs text-body-md leading-relaxed text-on-surface-variant">
                {t(`tips.${tip.key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
