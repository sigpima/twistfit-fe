'use client'

import { useTranslations } from 'next-intl'
import type { OccasionTag, StyleTag } from '../OutfitFlowProvider'

export type OccasionStyleMode = 'occasion' | 'style'

const OCCASION_OPTIONS: { id: OccasionTag; key: 'daily' | 'work' | 'party' | 'beach' }[] = [
  { id: 'hang-ngay', key: 'daily' },
  { id: 'di-lam', key: 'work' },
  { id: 'du-tiec', key: 'party' },
  { id: 'di-bien', key: 'beach' },
]

const STYLE_OPTIONS: { id: StyleTag; key: 'casual' | 'minimalist' | 'street' | 'formal' }[] = [
  { id: 'casual', key: 'casual' },
  { id: 'minimalist', key: 'minimalist' },
  { id: 'street', key: 'street' },
  { id: 'formal', key: 'formal' },
]

type OccasionStyleSelectorProps = {
  mode: OccasionStyleMode
  onModeChange: (mode: OccasionStyleMode) => void
  selectedOccasion: OccasionTag
  onOccasionChange: (tag: OccasionTag) => void
  selectedStyle: StyleTag
  onStyleChange: (tag: StyleTag) => void
}

export default function OccasionStyleSelector({
  mode,
  onModeChange,
  selectedOccasion,
  onOccasionChange,
  selectedStyle,
  onStyleChange,
}: OccasionStyleSelectorProps) {
  const t = useTranslations('Outfit.Step1.OccasionStyleSelector')

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
        {mode === 'occasion'
          ? OCCASION_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === selectedOccasion}
                onClick={() => onOccasionChange(option.id)}
                className={`rounded-full px-space-md py-2 text-label-md font-medium transition-all ${
                  option.id === selectedOccasion
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {t(`occasions.${option.key}`)}
              </button>
            ))
          : STYLE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === selectedStyle}
                onClick={() => onStyleChange(option.id)}
                className={`rounded-full px-space-md py-2 text-label-md font-medium transition-all ${
                  option.id === selectedStyle
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {t(`styles.${option.key}`)}
              </button>
            ))}
      </div>
    </div>
  )
}
