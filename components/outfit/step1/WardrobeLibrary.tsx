'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '../OutfitFlowProvider'
import OccasionStyleSelector from './OccasionStyleSelector'

type WardrobeItemResponse = {
  id: number
  blobUrl: string
  category: string
  styleTags: string[]
  occasionTags: string[]
  dominantColors: string[]
}

export default function WardrobeLibrary() {
  const t = useTranslations('Outfit.Step1.WardrobeLibrary')
  const { occasionStyleMode, setOccasionStyleMode, selectedOccasion, setSelectedOccasion, selectedStyle, setSelectedStyle } =
    useOutfitFlow()

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const [suggestExternal, setSuggestExternal] = useState(false)

  const [items, setItems] = useState<WardrobeItemResponse[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  const [hasPersonalColorResult, setHasPersonalColorResult] = useState(false)
  const [matchByPersonalColor, setMatchByPersonalColor] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiFetch('/wardrobe/items').then(async (response) => {
      if (cancelled) return
      if (!response.ok) {
        setLoadError(true)
        return
      }
      setItems((await response.json()) as WardrobeItemResponse[])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiFetch('/quiz-attempts/me').then(async (response) => {
      if (cancelled || !response.ok) return
      const result = (await response.json()) as { season: string } | null
      setHasPersonalColorResult(result !== null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const visibleItems = useMemo(() => {
    if (!items) return []
    const activeTag = occasionStyleMode === 'occasion' ? selectedOccasion : selectedStyle
    return items.filter((item) =>
      occasionStyleMode === 'occasion' ? item.occasionTags.includes(activeTag) : item.styleTags.includes(activeTag)
    )
  }, [items, occasionStyleMode, selectedOccasion, selectedStyle])

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
        {items && (
          <span className="rounded-full bg-primary-fixed px-space-md py-2 text-label-lg font-semibold text-on-primary-fixed">
            {t('itemCountBadge', { count: visibleItems.length })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex flex-wrap items-center gap-space-md">
          <label className="flex cursor-pointer select-none items-center gap-space-xs">
            <input
              type="checkbox"
              checked={suggestExternal}
              onChange={(event) => setSuggestExternal(event.target.checked)}
            />
            <span className="text-label-md font-medium text-on-surface">{t('suggestExternalLabel')}</span>
          </label>
          {hasPersonalColorResult ? (
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
        </div>

        <OccasionStyleSelector
          mode={occasionStyleMode}
          onModeChange={setOccasionStyleMode}
          selectedOccasion={selectedOccasion}
          onOccasionChange={setSelectedOccasion}
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
        />
      </div>

      {loadError ? (
        <p className="rounded-2xl bg-error-container p-space-lg text-center text-body-md text-on-error-container">
          {t('loadError')}
        </p>
      ) : !items ? (
        <p className="rounded-2xl bg-surface-container-low p-space-lg text-center text-body-md text-on-surface-variant">
          {t('loadingItems')}
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="rounded-2xl bg-surface-container-low p-space-lg text-center text-body-md text-on-surface-variant">
          {t('emptyState')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3 md:grid-cols-4">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest text-left shadow-sm"
            >
              <div className="aspect-square w-full overflow-hidden bg-surface-container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.blobUrl} alt={item.category} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col p-space-sm">
                <span className="truncate text-label-md font-semibold text-on-surface">{item.category}</span>
                <span className="text-body-sm text-on-surface-variant">{item.styleTags.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
