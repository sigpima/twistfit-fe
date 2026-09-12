'use client'

import { useTranslations } from 'next-intl'
import { useOutfitFlow } from '../OutfitFlowProvider'

export default function QuickSelectionSummary() {
  const t = useTranslations('Outfit.Step3.QuickSelectionSummary')
  const { selectedGarment, selectedModel } = useOutfitFlow()

  return (
    <div className="flex items-center gap-space-sm self-start rounded-xl bg-surface-container-lowest/90 px-space-md py-space-sm shadow-sm md:self-auto">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-secondary-container" />
        <span className="text-label-md font-medium text-on-surface">{selectedGarment.name}</span>
      </div>
      <span className="text-outline-variant">|</span>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-primary">face_3</span>
        <span className="text-label-md font-medium text-on-surface">{t('modelPrefix', { name: selectedModel.name })}</span>
      </div>
    </div>
  )
}
