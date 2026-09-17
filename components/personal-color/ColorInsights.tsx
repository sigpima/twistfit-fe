'use client'

import { useTranslations } from 'next-intl'
import CameraArButton from './CameraArButton'
import { SEASON_PROFILES, SEASON_RESULT_IMAGES } from '@/lib/seasonProfiles'
import type { SubSeason } from '@/lib/db'

export default function ColorInsights({ subSeason }: { subSeason: SubSeason }) {
  const t = useTranslations('PersonalColor.Result.Insights')
  const profile = SEASON_PROFILES[subSeason]

  return (
    <section aria-labelledby="metrics-and-guide-title" className="flex flex-col gap-6 lg:col-span-5">
      <h2 className="sr-only" id="metrics-and-guide-title">
        {t('srHeading')}
      </h2>
      <div className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#304461]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7b89ba]" />
          {t('idealPaletteHeading')}
        </h3>
        <div className="overflow-hidden rounded-2xl border border-[#7b89ba]/15 bg-[#eef4fa]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SEASON_RESULT_IMAGES[subSeason]}
            alt={t('paletteImageAlt', { season: profile.displayName })}
            className="aspect-square w-full object-cover"
          />
        </div>
      </div>
      <div className="flex justify-center">
        <CameraArButton subSeason={subSeason} />
      </div>
    </section>
  )
}
