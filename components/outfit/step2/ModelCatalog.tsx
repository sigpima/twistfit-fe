'use client'

import { useTranslations } from 'next-intl'
import { useState, type ChangeEvent } from 'react'
import { useOutfitFlow } from '../OutfitFlowProvider'
import type { CatalogModel, Undertone } from '@/lib/modelCatalog'

const UNDERTONE_FILTERS: { id: 'all' | Undertone; key: 'all' | 'warm' | 'cool' | 'neutral' }[] = [
  { id: 'all', key: 'all' },
  { id: 'warm', key: 'warm' },
  { id: 'cool', key: 'cool' },
  { id: 'neutral', key: 'neutral' },
]

export default function ModelCatalog({ models }: { models: CatalogModel[] }) {
  const t = useTranslations('Outfit.Step2.ModelCatalog')
  const { selectedModel, setSelectedModel } = useOutfitFlow()
  const [undertoneFilter, setUndertoneFilter] = useState<'all' | Undertone>('all')

  const visibleModels = models.filter(
    (model) => undertoneFilter === 'all' || model.undertone === undertoneFilter
  )

  function handleCustomUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const imageUrl = URL.createObjectURL(file)
    setSelectedModel({
      id: 'custom-upload',
      name: t('customUploadName'),
      image: imageUrl,
      dossierImage: imageUrl,
      sideImage: null,
      poseCount: 1,
      tagline: t('customUploadTagline'),
      undertone: 'neutral',
      height: '—',
      bodyShape: '—',
      waist: '—',
      personalColor: '—',
    })
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <span className="flex items-center gap-space-xs text-label-lg font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
            {t('filterHeading')}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm font-medium text-on-surface-variant">{t('undertoneLabel')}</label>
          <div className="flex items-center gap-1.5 rounded-xl bg-surface-container-low p-1">
            {UNDERTONE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setUndertoneFilter(filter.id)}
                className={`flex-1 rounded-lg py-1.5 text-center text-label-sm ${
                  undertoneFilter === filter.id
                    ? 'bg-surface-container-lowest font-semibold text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t(`undertoneFilters.${filter.key}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="text-label-lg font-semibold text-on-surface">
            {t('listHeading', { count: models.length })}
          </span>
          <span className="text-body-sm text-outline">{t('clickHint')}</span>
        </div>
        <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3 md:grid-cols-4">
          <label
            htmlFor="modelUploadInput"
            className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl bg-surface-container-high/60 p-space-md text-center shadow-xs transition-all hover:bg-secondary-fixed/30 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
              <span className="material-symbols-outlined text-[26px]">add</span>
            </div>
            <span className="mt-space-sm font-semibold text-label-lg text-on-surface">{t('uploadTitle')}</span>
            <p className="mt-1 px-1 text-body-sm text-outline">{t('uploadHint')}</p>
            <span className="mt-2 rounded-full bg-surface-container-lowest px-2 py-0.5 text-label-sm text-secondary">
              {t('uploadBadge')}
            </span>
          </label>
          <input
            id="modelUploadInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomUpload}
          />
          {visibleModels.map((model) => {
            const isSelected = selectedModel.id === String(model.id)
            return (
              <button
                key={model.id}
                type="button"
                onClick={() =>
                  setSelectedModel({
                    id: String(model.id),
                    name: model.name,
                    image: model.image,
                    dossierImage: model.dossierImage,
                    sideImage: model.sideImage,
                    poseCount: model.poseCount,
                    tagline: model.tagline,
                    undertone: model.undertone,
                    height: model.height,
                    bodyShape: model.bodyShape,
                    waist: model.waist,
                    personalColor: model.personalColor,
                  })
                }
                className={`relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest text-left shadow-sm transition-all hover:shadow-md ${
                  isSelected ? 'bg-gradient-to-b from-primary/5 to-secondary/10 shadow-lg' : ''
                }`}
              >
                {isSelected && (
                  <>
                    <div className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary shadow-md">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <div className="absolute left-2 top-2 z-10 rounded-full bg-surface-container-lowest/90 px-2 py-0.5 text-label-sm font-bold text-primary shadow-xs backdrop-blur-md">
                      {t('selectedBadge')}
                    </div>
                  </>
                )}
                <div className="aspect-[3/4] w-full overflow-hidden bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={model.image}
                    alt={model.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="flex flex-col bg-surface-container-lowest p-space-sm">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-label-lg font-semibold ${isSelected ? 'font-bold text-primary' : 'text-on-surface'}`}
                    >
                      {model.name}
                    </span>
                    <span className={`text-label-sm ${isSelected ? 'font-semibold text-primary' : 'text-outline'}`}>
                      {t('poseCount', { count: model.poseCount })}
                    </span>
                  </div>
                  <span className="mt-0.5 text-body-sm text-on-surface-variant">{model.tagline}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
