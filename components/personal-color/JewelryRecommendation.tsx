'use client'

import { useTranslations } from 'next-intl'
import { JEWELRY_RECOMMENDATIONS } from '@/lib/jewelryRecommendations'
import type { SubSeason } from '@/lib/db'

export default function JewelryRecommendation({ subSeason }: { subSeason: SubSeason }) {
  const t = useTranslations('PersonalColor.Result.Recommendations')
  const { colors, image } = JEWELRY_RECOMMENDATIONS[subSeason]

  return (
    <div className="flex items-center gap-3.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={t('items.jewelry.imageAlt')} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
      <p className="text-[11px] leading-relaxed text-[#304461]/80">{colors}</p>
    </div>
  )
}
