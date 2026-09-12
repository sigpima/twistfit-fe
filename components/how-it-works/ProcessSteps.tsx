'use client'

import { useTranslations } from 'next-intl'

const PALETTE_SWATCHES: {
  hex: string
  key: 'navy' | 'cobalt' | 'berry' | 'magenta' | 'teal' | 'ice' | 'noir' | 'violet' | 'ruby' | 'steel' | 'frost' | 'lavender'
  dark?: boolean
}[] = [
  { hex: '#0E1F44', key: 'navy' },
  { hex: '#2541B2', key: 'cobalt' },
  { hex: '#8F1D57', key: 'berry' },
  { hex: '#C1175A', key: 'magenta' },
  { hex: '#0F4C5C', key: 'teal' },
  { hex: '#F4F6FB', key: 'ice', dark: true },
  { hex: '#1B1B1E', key: 'noir' },
  { hex: '#6A0572', key: 'violet' },
  { hex: '#B80049', key: 'ruby' },
  { hex: '#3F88C5', key: 'steel' },
  { hex: '#A7C7E7', key: 'frost', dark: true },
  { hex: '#E0BBE4', key: 'lavender', dark: true },
]

export default function ProcessSteps() {
  const t = useTranslations('HowItWorks.ProcessSteps')

  return (
    <section className="mx-auto w-full max-w-7xl px-margin py-space-xl sm:px-margin-desktop lg:py-20">
      <div className="mb-16 text-center">
        <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
          {t('kicker')}
        </span>
        <h2 className="mt-1 text-headline-lg font-bold text-on-surface">{t('heading')}</h2>
      </div>

      {/* Step 1 */}
      <div className="mb-20 grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-6">
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-headline-sm font-bold text-on-secondary-fixed shadow-sm">
            01
          </div>
          <h3 className="text-headline-md font-bold text-on-surface">{t('step1.title')}</h3>
          <p className="mt-space-sm text-body-lg leading-relaxed text-on-surface-variant">
            {t.rich('step1.body', { bold: (chunks) => <strong>{chunks}</strong> })}
          </p>
          <div className="mt-space-lg flex items-start gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <span className="material-symbols-outlined mt-0.5 text-[24px] text-secondary">
              tips_and_updates
            </span>
            <div>
              <h4 className="text-label-lg font-semibold text-on-surface">{t('step1.tipTitle')}</h4>
              <p className="mt-0.5 text-body-md text-on-surface-variant">{t('step1.tipBody')}</p>
            </div>
          </div>
          <div className="mt-space-md flex items-center gap-space-md text-label-md text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>{' '}
              {t('step1.checkAutoBg')}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>{' '}
              {t('step1.checkPrivacy')}
            </span>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-space-lg shadow-xl">
            <div className="mb-space-md flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                {t('step1.calibratorLabel')}
              </span>
              <span className="rounded-full bg-surface-container px-2.5 py-1 text-label-sm text-primary">
                {t('step1.calibratorSpec')}
              </span>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-container-low">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/how-it-works/camera-calibrator.jpg"
                alt={t('step1.imageAlt')}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-60 w-48 items-center justify-center rounded-full border-2 border-dashed border-secondary-container/80">
                  <div className="h-4 w-4 animate-ping rounded-full bg-primary/40" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-surface-container-lowest/90 px-3 py-1.5 shadow-md backdrop-blur-md">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  center_focus_strong
                </span>
                <span className="text-label-sm text-on-surface">{t('step1.lockLabel')}</span>
              </div>
            </div>
            <div className="mt-space-md grid grid-cols-3 gap-space-sm">
              <div className="rounded-xl bg-surface-container-low p-space-sm text-center">
                <span className="block text-label-sm text-on-surface-variant">{t('step1.undertoneLabel')}</span>
                <span className="text-label-lg font-bold text-primary">{t('step1.undertoneValue')}</span>
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-sm text-center">
                <span className="block text-label-sm text-on-surface-variant">{t('step1.contrastLabel')}</span>
                <span className="text-label-lg font-bold text-secondary">{t('step1.contrastValue')}</span>
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-sm text-center">
                <span className="block text-label-sm text-on-surface-variant">{t('step1.pigmentLabel')}</span>
                <span className="text-label-lg font-bold text-on-surface">{t('step1.pigmentValue')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="mb-20 grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-6 lg:order-2">
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-headline-sm font-bold text-on-primary-fixed shadow-sm">
            02
          </div>
          <h3 className="text-headline-md font-bold text-on-surface">{t('step2.title')}</h3>
          <p className="mt-space-sm text-body-lg leading-relaxed text-on-surface-variant">{t('step2.body')}</p>
          <ul className="mt-space-md space-y-space-sm">
            <li className="flex items-start gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-secondary">palette</span>
              <div>
                <strong className="text-label-lg text-on-surface">{t('step2.bullet1Title')}</strong>
                <p className="text-body-sm text-on-surface-variant">{t('step2.bullet1Body')}</p>
              </div>
            </li>
            <li className="flex items-start gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-primary">brush</span>
              <div>
                <strong className="text-label-lg text-on-surface">{t('step2.bullet2Title')}</strong>
                <p className="text-body-sm text-on-surface-variant">{t('step2.bullet2Body')}</p>
              </div>
            </li>
            <li className="flex items-start gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-tertiary">diamond</span>
              <div>
                <strong className="text-label-lg text-on-surface">{t('step2.bullet3Title')}</strong>
                <p className="text-body-sm text-on-surface-variant">{t('step2.bullet3Body')}</p>
              </div>
            </li>
          </ul>
        </div>
        <div className="lg:col-span-6 lg:order-1">
          <div className="rounded-3xl bg-surface-container-lowest p-space-lg shadow-xl">
            <div className="mb-space-md flex items-center justify-between border-b border-surface-container-high pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[24px] text-secondary">ac_unit</span>
                <div>
                  <span className="block text-label-sm uppercase text-on-surface-variant">
                    {t('step2.resultLabel')}
                  </span>
                  <h4 className="text-headline-sm font-bold text-on-surface">{t('step2.resultSeason')}</h4>
                </div>
              </div>
              <span className="rounded-full bg-secondary-container px-space-md py-1 text-label-sm font-semibold text-on-secondary-fixed">
                {t('step2.confidenceBadge')}
              </span>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-label-sm font-semibold text-on-surface">{t('step2.paletteHeading')}</span>
                <span className="text-label-sm text-primary">{t('step2.paletteCount')}</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {PALETTE_SWATCHES.map((swatch) => (
                  <div
                    key={swatch.hex}
                    style={{ backgroundColor: swatch.hex }}
                    className="flex h-9 items-end justify-center rounded-lg p-1 shadow-sm"
                  >
                    <span className={`font-mono text-[9px] opacity-80 ${swatch.dark ? 'text-slate-800' : 'text-white'}`}>
                      {t(`step2.paletteSwatches.${swatch.key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-space-md grid grid-cols-2 gap-space-sm">
              <div className="flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-200 text-rose-700">
                  <span className="material-symbols-outlined text-[20px]">face_retouching_natural</span>
                </div>
                <div>
                  <span className="block text-label-sm text-on-surface-variant">{t('step2.lipstickLabel')}</span>
                  <span className="text-label-md font-bold text-on-surface">{t('step2.lipstickValue')}</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                  <span className="material-symbols-outlined text-[20px]">arrow_left_alt</span>
                </div>
                <div>
                  <span className="block text-label-sm text-on-surface-variant">{t('step2.jewelryLabel')}</span>
                  <span className="text-label-md font-bold text-on-surface">{t('step2.jewelryValue')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-6">
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary-fixed text-headline-sm font-bold text-on-tertiary-fixed shadow-sm">
            03
          </div>
          <h3 className="text-headline-md font-bold text-on-surface">{t('step3.title')}</h3>
          <p className="mt-space-sm text-body-lg leading-relaxed text-on-surface-variant">{t('step3.body')}</p>
          <div className="mt-space-lg grid grid-cols-2 gap-space-sm">
            <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
              <span className="material-symbols-outlined text-[24px] text-primary">view_in_ar</span>
              <h4 className="mt-1 text-label-lg font-bold text-on-surface">{t('step3.physicsTitle')}</h4>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">{t('step3.physicsBody')}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
              <span className="material-symbols-outlined text-[24px] text-secondary">checkroom</span>
              <h4 className="mt-1 text-label-lg font-bold text-on-surface">{t('step3.mixMatchTitle')}</h4>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">{t('step3.mixMatchBody')}</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="flex flex-col items-center gap-space-md rounded-3xl bg-surface-container-lowest p-space-lg shadow-xl md:flex-row">
            <div className="flex w-full flex-col items-center rounded-2xl bg-surface-container-low p-space-md md:w-5/12">
              <span className="mb-space-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                {t('step3.selectedGarmentLabel')}
              </span>
              <div className="h-48 w-36 overflow-hidden rounded-xl bg-white p-2 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/how-it-works/garment-isolated.jpg"
                  alt={t('step3.garmentImageAlt')}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="mt-space-sm text-center text-label-md font-bold text-on-surface">
                {t('step3.garmentName')}
              </span>
              <span className="mt-1 rounded-md bg-emerald-50 px-2 py-0.5 text-label-sm text-emerald-600">
                {t('step3.garmentMatchBadge')}
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed shadow-md">
              <span className="material-symbols-outlined text-[20px]">sync_alt</span>
            </div>
            <div className="flex w-full flex-col items-center md:w-7/12">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-container shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/how-it-works/tryon-result.jpg"
                  alt={t('step3.resultImageAlt')}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-xl bg-on-surface/80 px-3 py-1.5 text-on-primary backdrop-blur-md">
                  <span className="text-label-sm font-medium">{t('step3.resultLabel')}</span>
                  <span className="text-label-sm text-secondary-fixed">{t('step3.fitBadge')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
