'use client'

import { useTranslations } from 'next-intl'
import type { SubSeason } from '@/lib/db'
import {
  BLUSH_RECOMMENDATIONS,
  LIPSTICK_RECOMMENDATIONS,
  TONE_GROUP_BY_SUBSEASON,
  TONE_VARIANTS,
} from '@/lib/makeupRecommendations'
import RecommendationDisclosure from './RecommendationDisclosure'

export default function MakeupRecommendations({ subSeason }: { subSeason: SubSeason }) {
  const t = useTranslations('PersonalColor.Result.Recommendations')
  const toneGroup = TONE_GROUP_BY_SUBSEASON[subSeason]
  const toneVariants = TONE_VARIANTS[toneGroup]

  return (
    <div className="space-y-2.5">
      <RecommendationDisclosure title={t('items.makeup.blush')} nested>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BLUSH_RECOMMENDATIONS[subSeason]}
          alt={t('items.makeup.blushImageAlt')}
          className="w-full rounded-xl object-contain"
        />
      </RecommendationDisclosure>
      <RecommendationDisclosure title={t('items.makeup.lipstick')} nested>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LIPSTICK_RECOMMENDATIONS[subSeason]}
          alt={t('items.makeup.lipstickImageAlt')}
          className="w-full rounded-xl object-contain"
        />
      </RecommendationDisclosure>
      <RecommendationDisclosure title={t('items.makeup.toneLayout')} nested>
        <div className="space-y-3.5">
          <p className="text-[11px] font-bold text-[#304461]">{t(`toneGroups.${toneGroup}`)}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {toneVariants.map((variant) => (
              <div key={variant.name} className="overflow-hidden rounded-xl border border-[#7b89ba]/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={variant.image} alt={variant.name} className="aspect-[3/1] w-full object-cover" />
                <div className="p-2">
                  <p className="text-[11px] font-bold text-[#304461]">{variant.name}</p>
                  <p className="mt-0.5 text-[9px] leading-snug text-[#304461]/50">
                    {t('creditLabel')}: {variant.credit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RecommendationDisclosure>
    </div>
  )
}
