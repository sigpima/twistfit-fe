'use client'

import { useTranslations } from 'next-intl'
import { useOutfitFlow } from '../OutfitFlowProvider'

export default function PoseSelector() {
  const t = useTranslations('Outfit.Step3.PoseSelector')
  const { selectedModel, selectedPose, setSelectedPose } = useOutfitFlow()

  const poses = [
    { id: 'front', label: t('poses.front.label'), image: selectedModel.image },
    ...(selectedModel.sideImage
      ? [{ id: 'side', label: t('poses.side.label'), image: selectedModel.sideImage }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <h2 className="text-title-md font-semibold text-on-surface">{t('heading')}</h2>
      <div className="grid grid-cols-2 gap-space-md">
        {poses.map((pose) => {
          const isSelected = selectedPose.id === pose.id
          return (
            <button
              key={pose.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedPose({ id: pose.id, label: pose.label })}
              className={`flex flex-col overflow-hidden rounded-2xl text-center transition-all ${
                isSelected ? 'ring-2 ring-primary' : 'ring-1 ring-outline-variant hover:ring-primary/50'
              }`}
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-surface-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pose.image} alt={pose.label} className="h-full w-full object-cover" />
              </div>
              <span
                className={`p-space-sm text-label-md font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}
              >
                {pose.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
