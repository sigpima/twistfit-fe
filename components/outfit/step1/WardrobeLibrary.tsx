'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useOutfitFlow } from '../OutfitFlowProvider'
import OccasionStyleSelector, { type OccasionStyleMode } from './OccasionStyleSelector'
import { WARDROBE_ITEMS, type OccasionTag, type StyleTag } from './wardrobeMockData'

export default function WardrobeLibrary() {
  const t = useTranslations('Outfit.Step1.WardrobeLibrary')
  const { selectedGarment, setSelectedGarment } = useOutfitFlow()

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const [suggestExternal, setSuggestExternal] = useState(false)
  const [matchByPersonalColor, setMatchByPersonalColor] = useState(false)
  // Demo-only: simulates whether the user already has a personal color quiz
  // result. Real status comes from the quiz_attempts API once this screen
  // is wired to the backend — remove this toggle at that point.
  const [hasPersonalColorResultDemo, setHasPersonalColorResultDemo] = useState(false)

  const [mode, setMode] = useState<OccasionStyleMode>('occasion')
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionTag>('hang-ngay')
  const [selectedStyle, setSelectedStyle] = useState<StyleTag>('casual')

  const visibleItems = useMemo(() => {
    const activeTag = mode === 'occasion' ? selectedOccasion : selectedStyle
    const filtered = WARDROBE_ITEMS.filter((item) =>
      mode === 'occasion' ? item.occasionTags.includes(activeTag as OccasionTag) : item.styleTags.includes(activeTag as StyleTag)
    )
    return filtered.slice().sort((a, b) => a.type.localeCompare(b.type, 'vi'))
  }, [mode, selectedOccasion, selectedStyle])

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSortMenuOpen((open) => !open)}
            aria-expanded={isSortMenuOpen}
            className="flex items-center gap-space-xs rounded-xl bg-surface-container-low px-space-md py-2 text-label-lg font-semibold text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">sort</span>
            <span>{t('sortLabel')}</span>
            <span className="material-symbols-outlined text-[18px]">
              {isSortMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {isSortMenuOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl bg-surface-container-lowest p-1 shadow-lg">
              <button
                type="button"
                onClick={() => setIsSortMenuOpen(false)}
                className="flex w-full items-center justify-between rounded-lg px-space-sm py-2 text-left text-label-md font-medium text-primary"
              >
                <span>{t('sortByCategory')}</span>
                <span className="material-symbols-outlined text-[18px]">check</span>
              </button>
            </div>
          )}
        </div>
        <span className="rounded-full bg-primary-fixed px-space-md py-2 text-label-lg font-semibold text-on-primary-fixed">
          {t('matchBadge', { count: 1 })}
        </span>
      </div>

      <div className="flex flex-col items-start gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <label className="flex cursor-pointer select-none items-center gap-space-xs">
          <input
            type="checkbox"
            checked={suggestExternal}
            onChange={(event) => setSuggestExternal(event.target.checked)}
          />
          <span className="text-label-md font-medium text-on-surface">{t('suggestExternalLabel')}</span>
        </label>
        {hasPersonalColorResultDemo ? (
          <label className="flex cursor-pointer select-none items-center gap-space-xs">
            <input
              type="checkbox"
              checked={matchByPersonalColor}
              onChange={(event) => setMatchByPersonalColor(event.target.checked)}
            />
            <span className="text-label-md font-medium text-on-surface">{t('personalColorLabel')}</span>
          </label>
        ) : (
          <Link
            href="/personal-color/quiz"
            className="flex items-center gap-space-xs rounded-full bg-secondary-fixed px-space-md py-2 text-label-md font-semibold text-on-secondary-fixed hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">palette</span>
            <span>{t('personalColorCta')}</span>
          </Link>
        )}
        <label className="mt-space-xs flex cursor-pointer select-none items-center gap-space-xs rounded-full border border-dashed border-outline px-space-sm py-1 text-label-sm text-outline">
          <input
            type="checkbox"
            checked={hasPersonalColorResultDemo}
            onChange={(event) => setHasPersonalColorResultDemo(event.target.checked)}
          />
          <span>{t('demoToggleLabel')}</span>
        </label>
      </div>

      <OccasionStyleSelector
        mode={mode}
        onModeChange={setMode}
        selectedOccasion={selectedOccasion}
        onOccasionChange={setSelectedOccasion}
        selectedStyle={selectedStyle}
        onStyleChange={setSelectedStyle}
      />

      {visibleItems.length === 0 ? (
        <p className="rounded-2xl bg-surface-container-low p-space-lg text-center text-body-md text-on-surface-variant">
          {t('emptyState')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3 md:grid-cols-4">
          {visibleItems.map((item) => {
            const isSelected = selectedGarment.id === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedGarment(item)}
                className={`relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest text-left shadow-sm transition-all hover:shadow-md ${
                  isSelected ? 'bg-gradient-to-b from-primary/5 to-secondary/10 shadow-lg' : ''
                }`}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary shadow-md">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                )}
                <div className="aspect-square w-full overflow-hidden bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col p-space-sm">
                  <span
                    className={`truncate text-label-md font-semibold ${isSelected ? 'text-primary' : 'text-on-surface'}`}
                  >
                    {item.name}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">{item.type}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
