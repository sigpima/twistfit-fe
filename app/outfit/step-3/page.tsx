'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '@/components/outfit/OutfitFlowProvider'
import FlowOverviewBanner from '@/components/outfit/FlowOverviewBanner'
import QuickSelectionSummary from '@/components/outfit/step3/QuickSelectionSummary'
import PoseSelector from '@/components/outfit/step3/PoseSelector'
import RenderSettings from '@/components/outfit/step3/RenderSettings'
import BodyMeasurements from '@/components/outfit/step3/BodyMeasurements'

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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-lg px-margin-desktop pt-space-lg">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-label-sm font-semibold uppercase text-on-secondary-fixed">
                {t('badge')}
              </span>
              <span className="text-outline-variant">•</span>
              <span className="text-label-sm text-outline">{t('engineBadge')}</span>
            </div>
            <h1 className="text-headline-lg text-on-surface">{t('heading')}</h1>
            <p className="text-body-md text-on-surface-variant">{t('subheading')}</p>
          </div>
          <QuickSelectionSummary />
        </div>
        <FlowOverviewBanner
          title={t('flowBannerTitle')}
          subtitle={t('flowBannerSubtitle')}
          image="/outfit/flow-overview-step3.png"
          imageAlt={t('flowBannerImageAlt')}
        />
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-7">
            <PoseSelector />
            <RenderSettings />
          </div>
          <div className="lg:col-span-5">
            <div className="flex flex-col gap-space-md">
              <BodyMeasurements />
              <div className="flex flex-col gap-space-sm">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="group flex w-full transform items-center justify-center gap-space-sm rounded-full bg-gradient-to-r from-secondary via-primary-container to-primary px-space-lg py-space-md text-headline-sm text-on-primary shadow-xl transition-all hover:shadow-2xl active:scale-98 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[26px] transition-transform group-hover:rotate-12">
                    bolt
                  </span>
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
                <div className="flex items-center justify-center gap-2 text-label-sm text-outline">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>{t('estimatedTime')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container-low/70 p-space-lg md:flex-row">
          <div className="flex items-center gap-space-md">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container shadow-sm">
              <span className="material-symbols-outlined text-[32px]">tips_and_updates</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm text-on-surface">{t('tipTitle')}</span>
              <p className="max-w-2xl text-body-md text-on-surface-variant">{t('tipBody')}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-space-sm">
            <span className="text-label-lg font-semibold text-primary">{t('creditsBalance')}</span>
            <button
              type="button"
              className="rounded-full bg-primary-fixed px-space-md py-space-xs text-label-md font-semibold text-on-primary-fixed transition-all hover:bg-primary hover:text-on-primary"
            >
              {t('topUpButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
