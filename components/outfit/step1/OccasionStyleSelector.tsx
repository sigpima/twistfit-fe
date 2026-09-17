'use client'

import { useTranslations } from 'next-intl'
import type { TaxonomyValue } from '@/lib/taxonomy'

export type OccasionStyleMode = 'occasion' | 'style'

type OccasionStyleSelectorProps = {
  mode: OccasionStyleMode
  onModeChange: (mode: OccasionStyleMode) => void
  occasionValues: TaxonomyValue[]
  selectedOccasion: string
  onOccasionChange: (tag: string) => void
  styleValues: TaxonomyValue[]
  selectedStyle: string
  onStyleChange: (tag: string) => void
}

export default function OccasionStyleSelector({
  mode,
  onModeChange,
  occasionValues,
  selectedOccasion,
  onOccasionChange,
  styleValues,
  selectedStyle,
  onStyleChange,
}: OccasionStyleSelectorProps) {
  const t = useTranslations('Outfit.Step1.OccasionStyleSelector')
  const activeValues = mode === 'occasion' ? occasionValues : styleValues

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="inline-flex w-full max-w-xs items-center gap-1 rounded-xl bg-surface-container-low p-1 sm:w-auto">
        <button
          type="button"
          onClick={() => onModeChange('occasion')}
          aria-pressed={mode === 'occasion'}
          className={`flex-1 rounded-lg px-space-md py-2 text-center text-label-md font-semibold transition-all ${
            mode === 'occasion'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {t('modeOccasion')}
        </button>
        <button
          type="button"
          onClick={() => onModeChange('style')}
          aria-pressed={mode === 'style'}
          className={`flex-1 rounded-lg px-space-md py-2 text-center text-label-md font-semibold transition-all ${
            mode === 'style'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {t('modeStyle')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeValues.map((value) => {
          const isSelected = mode === 'occasion' ? value.key === selectedOccasion : value.key === selectedStyle
          return (
            <button
              key={value.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => (mode === 'occasion' ? onOccasionChange(value.key) : onStyleChange(value.key))}
              className={`rounded-full px-space-md py-2 text-label-md font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {value.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
