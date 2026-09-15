'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '@/components/outfit/OutfitFlowProvider'
import PoseSelector from '@/components/outfit/step3/PoseSelector'

export default function Step3Page() {
  const t = useTranslations('Outfit.Step3.Page')
  const router = useRouter()
  const { selectedModel, selectedPose, occasionStyleMode, selectedOccasion, selectedStyle, setJobId } = useOutfitFlow()
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
        pose: selectedPose.id === 'side' ? 'side' : 'front',
      }),
    })

    setIsGenerating(false)

    if (!response.ok) {
      setGenerateError(true)
      return
    }

    const job = (await response.json()) as { id: number }
    setJobId(job.id)
    router.push('/outfit/step-4')
  }

  return (
    <div className="flex w-full flex-col pb-space-xl">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-space-lg px-margin-desktop pt-space-lg">
        <div className="flex flex-col gap-space-xs">
          <h1 className="text-headline-lg text-on-surface">{t('heading')}</h1>
          <p className="text-body-md text-on-surface-variant">{t('subheading')}</p>
        </div>
        <PoseSelector />
        <div className="flex flex-col gap-space-sm">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-space-sm rounded-full bg-primary px-space-lg py-space-md text-headline-sm text-on-primary shadow-md transition-all hover:shadow-lg disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[24px]">bolt</span>
            <span>{t('generateButton')}</span>
          </button>
          {generateError && <p className="text-center text-body-sm text-error">{t('generateError')}</p>}
          <button
            type="button"
            onClick={() => router.push('/outfit/step-2')}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container px-space-md py-space-sm text-label-lg text-on-surface transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{t('backButton')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
