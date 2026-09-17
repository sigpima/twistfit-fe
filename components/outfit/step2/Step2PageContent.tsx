'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '../OutfitFlowProvider'
import SelectedGarmentBanner from './SelectedGarmentBanner'
import ModelCatalog from './ModelCatalog'
import type { CatalogModel } from '@/lib/modelCatalog'

export default function Step2PageContent({ models }: { models: CatalogModel[] }) {
  const t = useTranslations('Outfit.Step2.Page')
  const router = useRouter()
  const { selectedModel, occasionStyleMode, selectedOccasion, selectedStyle, setJobId } = useOutfitFlow()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(false)

  async function handleGenerate() {
    const catalogModelId = Number(selectedModel.id)
    if (Number.isNaN(catalogModelId)) {
      setGenerateError(true)
      return
    }

    setIsGenerating(true)
    setGenerateError(false)

    const response = await apiFetch('/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogModelId,
        occasion: occasionStyleMode === 'occasion' ? selectedOccasion : 'hang-ngay',
        style: occasionStyleMode === 'style' ? selectedStyle : 'casual',
      }),
    })

    setIsGenerating(false)

    if (!response.ok) {
      setGenerateError(true)
      return
    }

    const job = (await response.json()) as { id: number }
    setJobId(job.id)
    router.push('/outfit/step-3')
  }

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-surface-container-low px-margin-desktop py-space-lg">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-space-md lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-space-xs text-label-md font-semibold uppercase tracking-wider text-secondary">
              <span className="material-symbols-outlined text-[18px]">face_retouching_natural</span>
              {t('eyebrow')}
            </div>
            <h1 className="mt-1 text-headline-lg tracking-tight text-on-surface">{t('heading')}</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">{t('subheading')}</p>
          </div>
          <SelectedGarmentBanner />
        </div>
      </section>
      <section className="w-full bg-background px-margin-desktop py-space-xl">
        <div className="mx-auto max-w-7xl">
          <ModelCatalog models={models} />
        </div>
      </section>
      <section className="sticky bottom-0 z-40 w-full bg-surface-container-lowest/95 px-margin-desktop py-space-md shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-space-sm">
          <div className="flex w-full flex-col items-center justify-between gap-space-md sm:flex-row">
            <Link
              href="/outfit/step-1"
              className="flex w-full items-center justify-center gap-space-xs rounded-full bg-surface-container-high px-space-lg py-3 text-label-lg text-on-surface transition-colors hover:bg-surface-container-highest sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              {t('backButton')}
            </Link>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex w-full items-center justify-center gap-space-sm rounded-full bg-primary px-space-xl py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg disabled:opacity-60 sm:w-auto"
            >
              <span>{t('generateButton')}</span>
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </button>
          </div>
          {generateError && <p className="text-center text-body-sm text-error">{t('generateError')}</p>}
        </div>
      </section>
    </div>
  )
}
