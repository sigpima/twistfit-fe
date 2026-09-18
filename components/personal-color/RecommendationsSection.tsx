'use client'

import { useTranslations } from 'next-intl'
import type { SubSeason } from '@/lib/db'
import RecommendationDisclosure from './RecommendationDisclosure'
import JewelryRecommendation from './JewelryRecommendation'
import MakeupRecommendations from './MakeupRecommendations'

export default function RecommendationsSection({ subSeason }: { subSeason: SubSeason }) {
  const t = useTranslations('PersonalColor.Result.Recommendations')

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
      <div className="space-y-3">
        <RecommendationDisclosure title={t('items.jewelry.title')}>
          <JewelryRecommendation subSeason={subSeason} />
        </RecommendationDisclosure>
        <RecommendationDisclosure title={t('items.makeup.title')}>
          <MakeupRecommendations subSeason={subSeason} />
        </RecommendationDisclosure>
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
