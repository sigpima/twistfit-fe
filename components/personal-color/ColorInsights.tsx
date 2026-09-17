'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import CameraArButton from './CameraArButton'
import { SEASON_PROFILES } from '@/lib/seasonProfiles'
import type { SubSeason } from '@/lib/db'

const RECOMMENDATION_ICONS: Record<'outfit' | 'lipstick' | 'accessory', string> = {
  outfit: 'checkroom',
  lipstick: 'favorite',
  accessory: 'diamond',
}

export default function ColorInsights({ subSeason }: { subSeason: SubSeason }) {
  const t = useTranslations('PersonalColor.Result.Insights')
  const profile = SEASON_PROFILES[subSeason]
  const recommendationKeys = ['outfit', 'lipstick', 'accessory'] as const

  return (
    <section aria-labelledby="metrics-and-guide-title" className="flex flex-col gap-6 lg:col-span-5">
      <h2 className="sr-only" id="metrics-and-guide-title">
        {t('srHeading')}
      </h2>
      <div className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]">
        <div className="mb-4 flex items-center gap-2.5 border-b border-[#7b89ba]/15 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fdc8e9]/40 text-[#304461]">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
          </div>
          <h3 className="text-base font-bold text-[#304461]">{t('recommendationsHeading')}</h3>
        </div>
        <div className="space-y-3.5">
          {recommendationKeys.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3.5 rounded-2xl border border-[#7b89ba]/10 bg-[#eef4fa]/50 p-2.5 transition-colors hover:bg-[#eef4fa]"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a89dc] to-[#7b89ba] text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">{RECOMMENDATION_ICONS[key]}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#304461]">{t(`recommendations.${key}.title`)}</h4>
                <p className="mt-0.5 text-[11px] leading-snug text-[#304461]/80">{profile.recommendations[key]}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#7b89ba]/20 bg-gradient-to-r from-[#eef4fa] via-indigo-50/60 to-pink-50/60 p-3.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#7b89ba]/20 text-[#7b89ba]">
            <span className="material-symbols-outlined text-[16px]">favorite</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#304461]">{t('ctaBannerTitle')}</p>
            <p className="text-[11px] text-[#304461]/75">{t('ctaBannerSubtitle')}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/outfit/step-1"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#304461] px-5 py-3 text-center text-xs font-bold text-white shadow-md transition-all hover:bg-[#233247] hover:shadow-lg"
        >
          <span className="material-symbols-outlined text-[16px]">checkroom</span>
          <span>{t('tryOutfitButton')}</span>
        </Link>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#7b89ba]/30 bg-white px-4 py-3 text-xs font-semibold text-[#304461] transition-all hover:border-[#7b89ba] hover:bg-[#eef4fa] sm:w-auto"
        >
          <span className="material-symbols-outlined text-[16px] text-rose-500">picture_as_pdf</span>
          <span>{t('downloadPdfButton')}</span>
        </button>
        <CameraArButton subSeason={subSeason} />
      </div>
    </section>
  )
}
