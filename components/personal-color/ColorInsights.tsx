'use client'

import { useTranslations } from 'next-intl'
import { IDEAL_PALETTE_COLORS } from '@/lib/idealPaletteColors'
import type { SubSeason } from '@/lib/db'

export default function ColorInsights({ subSeason }: { subSeason: SubSeason }) {
  const t = useTranslations('PersonalColor.Result.Insights')
  const colors = IDEAL_PALETTE_COLORS[subSeason]

  return (
    <section aria-labelledby="palette-and-camera-title" className="flex flex-col gap-6">
      <h2 className="sr-only" id="palette-and-camera-title">
        {t('srHeading')}
      </h2>
      <div className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#304461]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7b89ba]" />
          {t('idealPaletteHeading')}
        </h3>
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
          {colors.map((color, index) => (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <span
                className="h-10 w-10 rounded-full border border-[#7b89ba]/15 shadow-xs sm:h-12 sm:w-12"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] font-mono uppercase text-[#304461]/50">{color}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
