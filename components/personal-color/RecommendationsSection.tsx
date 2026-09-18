'use client'

import { useTranslations } from 'next-intl'
import { SEASON_PROFILES } from '@/lib/seasonProfiles'
import type { SubSeason } from '@/lib/db'

const RECOMMENDATION_ICONS: Record<'outfit' | 'lipstick' | 'accessory', string> = {
  outfit: 'checkroom',
  lipstick: 'favorite',
  accessory: 'diamond',
}

const RECOMMENDATION_KEYS = ['outfit', 'lipstick', 'accessory'] as const

export default function RecommendationsSection({ subSeason }: { subSeason: SubSeason }) {
  const t = useTranslations('PersonalColor.Result.Recommendations')
  const profile = SEASON_PROFILES[subSeason]

  return (
    <section
      aria-labelledby="recommendations-title"
      className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]"
    >
      <div className="mb-4 flex items-center gap-2.5 border-b border-[#7b89ba]/15 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fdc8e9]/40 text-[#304461]">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
        </div>
        <h2 className="text-base font-bold text-[#304461]" id="recommendations-title">
          {t('heading')}
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {RECOMMENDATION_KEYS.map((key) => (
          <div
            key={key}
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#7b89ba]/10 bg-[#eef4fa]/50 p-3.5 text-center transition-colors hover:bg-[#eef4fa]"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a89dc] to-[#7b89ba] text-white shadow-xs">
              <span className="material-symbols-outlined text-[20px]">{RECOMMENDATION_ICONS[key]}</span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#304461]">{t(`items.${key}.title`)}</h3>
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
    </section>
  )
}
