'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useOutfitFlow } from '../OutfitFlowProvider'

export default function SelectedGarmentBanner() {
  const t = useTranslations('Outfit.Step2.SelectedGarmentBanner')
  const { selectedGarment } = useOutfitFlow()

  return (
    <div className="flex shrink-0 items-center gap-space-md self-start rounded-2xl bg-surface-container-lowest p-space-sm pr-space-md shadow-sm lg:self-auto">
      <div className="relative h-16 w-14 overflow-hidden rounded-xl bg-secondary-fixed/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selectedGarment.thumbnail} alt={selectedGarment.name} className="h-full w-full object-cover" />
        <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
          ✓
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-label-sm uppercase tracking-wider text-outline">{t('selectedLabel')}</span>
        <span className="line-clamp-1 text-title-md text-on-surface">{selectedGarment.name}</span>
        <div className="mt-0.5 flex items-center gap-space-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary-fixed" />
          <span className="text-body-sm text-on-surface-variant">{t('paletteNote', { tone: selectedGarment.tone })}</span>
        </div>
      </div>
      <Link href="/outfit/step-1" className="ml-2 text-label-sm text-primary underline hover:text-primary-container">
        {t('changeLink')}
      </Link>
    </div>
  )
}
