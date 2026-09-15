'use client'

import { useTranslations } from 'next-intl'

const MILESTONES = [
  { key: 'founding', color: 'text-secondary' },
  { key: 'partnership', color: 'text-primary' },
  { key: 'current', color: 'text-tertiary' },
] as const

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
            <h2 className="text-headline-lg leading-snug text-on-surface">
              {t.rich('headingPrefix', {
                br: () => <br />,
                quote: (chunks) => <span className="font-serif italic text-primary">{chunks}</span>,
              })}
            </h2>
            <div className="flex flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
              <p>{t('paragraph1')}</p>
              <p>{t.rich('paragraph2', { bold: (chunks) => <strong>{chunks}</strong> })}</p>
              <p>{t('paragraph3')}</p>
            </div>
            <div className="mt-space-sm grid grid-cols-3 gap-space-sm pt-space-sm">
              {MILESTONES.map((milestone) => (
                <div key={milestone.key} className="rounded-lg bg-surface-container-lowest p-space-sm shadow-sm">
                  <span className={`text-label-sm font-semibold ${milestone.color}`}>
                    {t(`milestones.${milestone.key}.year`)}
                  </span>
                  <p className="mt-space-xs text-label-md font-medium text-on-surface">
                    {t(`milestones.${milestone.key}.label`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex flex-col items-center lg:col-span-6">
            <div className="relative aspect-[4/5] w-full max-w-lg overflow-hidden rounded-xl shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about/story-draping.jpg"
                alt={t('imageAlt')}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent" />
              <div className="absolute inset-x-space-md bottom-space-md text-inverse-on-surface">
                <span className="text-label-sm uppercase tracking-wider text-secondary-container">
                  {t('imageCaptionLabel')}
                </span>
                <p className="text-headline-sm font-semibold">{t('imageCaptionTitle')}</p>
              </div>
            </div>
            <div className="relative z-20 mt-space-md w-11/12 rounded-xl bg-surface-container-lowest/90 p-space-md shadow-xl backdrop-blur-md sm:-ml-24 sm:-mt-16 sm:w-80">
              <div className="mb-space-xs flex items-center gap-space-sm">
                <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
                <span className="text-label-sm font-semibold uppercase text-primary">{t('aiCoreLabel')}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant">{t('aiCoreBody')}</p>
              <div className="mt-space-sm flex items-center justify-between rounded bg-surface-container-low/50 px-space-sm py-1 pt-space-xs text-label-sm font-semibold text-on-surface">
                <span>{t('spectrumLabel')}</span>
                <span className="font-bold text-secondary">{t('spectrumValue')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
