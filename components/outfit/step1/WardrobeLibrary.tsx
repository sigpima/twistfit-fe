'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { findGroup, type TaxonomyGroup } from '@/lib/taxonomy'
import type { WardrobeItem } from '@/lib/wardrobe'
import { useOutfitFlow } from '../OutfitFlowProvider'
import OccasionStyleSelector from './OccasionStyleSelector'

export default function WardrobeLibrary() {
  const t = useTranslations('Outfit.Step1.WardrobeLibrary')
  const {
    occasionStyleMode,
    setOccasionStyleMode,
    selectedOccasion,
    setSelectedOccasion,
    selectedStyle,
    setSelectedStyle,
    suggestAccessories,
    setSuggestAccessories,
  } = useOutfitFlow()

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [selectedClothingTypes, setSelectedClothingTypes] = useState<string[]>([])

  const [items, setItems] = useState<WardrobeItem[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [taxonomyGroups, setTaxonomyGroups] = useState<TaxonomyGroup[]>([])

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
      setItems((await response.json()) as WardrobeItem[])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiFetch('/taxonomy').then(async (response) => {
      if (cancelled || !response.ok) return
      setTaxonomyGroups((await response.json()) as TaxonomyGroup[])
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

  const clothingTypeGroup = findGroup(taxonomyGroups, 'clothing-type')

  function toggleClothingType(valueKey: string) {
    setSelectedClothingTypes((current) =>
      current.includes(valueKey) ? current.filter((key) => key !== valueKey) : [...current, valueKey]
    )
  }

  const visibleItems = useMemo(() => {
    if (!items) return []
    const activeTag = occasionStyleMode === 'occasion' ? selectedOccasion : selectedStyle
    return items.filter((item) => {
      const matchesOccasionOrStyle =
        occasionStyleMode === 'occasion'
          ? (item.attributes.occasion ?? []).includes(activeTag)
          : (item.attributes.style ?? []).includes(activeTag)
      const matchesClothingType =
        selectedClothingTypes.length === 0 ||
        (item.attributes['clothing-type'] ?? []).some((value) => selectedClothingTypes.includes(value))
      return matchesOccasionOrStyle && matchesClothingType
    })
  }, [items, occasionStyleMode, selectedOccasion, selectedStyle, selectedClothingTypes])

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFilterMenuOpen((open) => !open)}
            aria-expanded={isFilterMenuOpen}
            className="flex items-center gap-space-xs rounded-xl bg-surface-container-low px-space-md py-2 text-label-lg font-semibold text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              filter_list
            </span>
            <span>{t('filterLabel')}</span>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {isFilterMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {isFilterMenuOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl bg-surface-container-lowest p-1 shadow-lg">
              {clothingTypeGroup && clothingTypeGroup.values.length > 0 ? (
                clothingTypeGroup.values.map((value) => (
                  <label
                    key={value.id}
                    className="flex w-full cursor-pointer items-center gap-space-xs rounded-lg px-space-sm py-2 text-left text-label-md font-medium text-on-surface hover:bg-surface-container"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClothingTypes.includes(value.key)}
                      onChange={() => toggleClothingType(value.key)}
                    />
                    {value.label}
                  </label>
                ))
              ) : (
                <p className="px-space-sm py-2 text-label-md text-on-surface-variant">{t('filterEmptyOption')}</p>
              )}
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
              checked={suggestAccessories}
              onChange={(event) => setSuggestAccessories(event.target.checked)}
            />
            <span className="text-label-md font-medium text-on-surface">{t('suggestAccessoriesLabel')}</span>
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
          occasionValues={findGroup(taxonomyGroups, 'occasion')?.values ?? []}
          selectedOccasion={selectedOccasion}
          onOccasionChange={setSelectedOccasion}
          styleValues={findGroup(taxonomyGroups, 'style')?.values ?? []}
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
          {visibleItems.map((item) => {
            const clothingType = item.attributes['clothing-type']?.[0] ?? ''
            const clothingTypeLabel =
              clothingTypeGroup?.values.find((value) => value.key === clothingType)?.label ?? clothingType
            return (
              <div
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest text-left shadow-sm"
              >
                <div className="aspect-square w-full overflow-hidden bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.blobUrl} alt={clothingTypeLabel} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col p-space-sm">
                  <span className="truncate text-label-md font-semibold text-on-surface">{clothingTypeLabel}</span>
                  <span className="text-body-sm text-on-surface-variant">
                    {(item.attributes.style ?? []).join(', ')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
