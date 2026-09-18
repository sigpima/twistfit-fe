'use client'

import { useTranslations } from 'next-intl'
import { SEASON_PROFILES, SEASON_PORTRAIT_IMAGES } from '@/lib/seasonProfiles'
import { AXIS_VALUE_LABELS } from '@/lib/axisValueLabels'
import { ColorMetricsSummary } from './ColorMetricsSection'
import type { AxisValue, SubSeason } from '@/lib/db'

export type ProfileCardResult = {
  subSeason: SubSeason
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
  hueScore?: number | null
  valueScore?: number | null
  chromaScore?: number | null
}

export default function ColorProfileCard({ result }: { result: ProfileCardResult }) {
  const t = useTranslations('PersonalColor.Result.ProfileCard')
  const profile = SEASON_PROFILES[result.subSeason]

  return (
    <section aria-labelledby="primary-analysis-title" className="flex flex-col gap-6">
      <h2 className="sr-only" id="primary-analysis-title">
        {t('srHeading')}
      </h2>
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-[#7b89ba]/15 bg-white p-5 shadow-[0_4px_20px_rgba(48,68,97,0.05)] md:flex-row md:items-stretch sm:p-6">
        <div className="relative w-full max-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[#7b89ba]/20 bg-[#eef4fa] shadow-inner md:w-5/12 md:max-w-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SEASON_PORTRAIT_IMAGES[result.subSeason]}
            alt={t('portraitAlt')}
            className="aspect-[4/5] h-full w-full object-cover object-center"
          />
        </div>
        <div className="flex w-full flex-col justify-center py-1 md:w-7/12">
          <div className="mb-3 inline-block rounded-full border border-[#7b89ba]/20 bg-[#eef4fa] px-3 py-1 text-xs font-semibold text-[#7b89ba]">
            {t('paletteLabel')}
          </div>
          <div className="mb-3 flex items-center gap-3.5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a89dc] to-[#7b89ba] text-white shadow-md">
              <span className="material-symbols-outlined text-[24px]">ac_unit</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-[#304461]">{profile.displayName}</h3>
              <p className="text-xs font-semibold text-[#304461]/60">
                {t('tagline', {
                  hue: AXIS_VALUE_LABELS[result.hueResult],
                  value: AXIS_VALUE_LABELS[result.valueResult],
                  chroma: AXIS_VALUE_LABELS[result.chromaResult],
                })}
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-[#304461]/80 sm:text-[13px]">{profile.description}</p>
          <ColorMetricsSummary result={result} />
        </div>
      </div>
    </section>
  )
}
