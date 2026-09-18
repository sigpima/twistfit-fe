'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { SubSeason } from '@/lib/db'
import RecommendationDisclosure from './RecommendationDisclosure'
import JewelryRecommendation from './JewelryRecommendation'
import MakeupRecommendations from './MakeupRecommendations'
import CameraArButton from './CameraArButton'

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
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
        <Link
          href="/personal-color/quiz"
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#7b89ba]/30 bg-white px-4 py-3 text-xs font-semibold text-[#304461] transition-all hover:border-[#7b89ba] hover:bg-[#eef4fa]"
        >
          <span className="material-symbols-outlined text-[16px] text-primary">refresh</span>
          <span>{t('retakeButton')}</span>
        </Link>
        <CameraArButton subSeason={subSeason} />
      </div>
    </section>
  )
}
