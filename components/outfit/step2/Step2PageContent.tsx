'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '../OutfitFlowProvider'
import ModelCatalog from './ModelCatalog'
import type { CatalogModel } from '@/lib/modelCatalog'

type TryOnQuota = { usedToday: number; limit: number; remainingToday: number }

export default function Step2PageContent({ models }: { models: CatalogModel[] }) {
  const t = useTranslations('Outfit.Step2.Page')
  const router = useRouter()
  const { selectedModel, occasionStyleMode, selectedOccasion, selectedStyle, setJobId } = useOutfitFlow()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [quota, setQuota] = useState<TryOnQuota | null>(null)
  const [quotaLoadFailed, setQuotaLoadFailed] = useState(false)
  const [quotaRetryToken, setQuotaRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setQuotaLoadFailed(false)
    apiFetch('/tryon/quota')
      .then((response) => {
        if (cancelled) return
        if (!response.ok) {
          setQuotaLoadFailed(true)
          return
        }
        response.json().then((data: TryOnQuota) => {
          if (!cancelled && typeof data.remainingToday === 'number') setQuota(data)
        })
      })
      .catch(() => {
        if (!cancelled) setQuotaLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [quotaRetryToken])

  async function handleGenerate() {
    const catalogModelId = Number(selectedModel.id)
    if (Number.isNaN(catalogModelId)) {
      setGenerateError(t('generateError'))
      return
    }

    setIsGenerating(true)
    setGenerateError(null)

    const response = await apiFetch('/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogModelId,
        occasion: occasionStyleMode === 'occasion' ? selectedOccasion : null,
        style: occasionStyleMode === 'style' ? selectedStyle : null,
      }),
    })

    setIsGenerating(false)

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { detail?: string } | null
      setGenerateError(body?.detail ?? t('generateError'))
      if (response.status === 429) setQuota((current) => (current ? { ...current, remainingToday: 0 } : current))
      return
    }

    setQuota((current) => (current ? { ...current, remainingToday: current.remainingToday - 1 } : current))
    const job = (await response.json()) as { id: number }
    setJobId(job.id)
    router.push('/outfit/step-3')
  }

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-surface-container-low px-margin-desktop py-space-lg">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-headline-lg tracking-tight text-on-surface">{t('heading')}</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">{t('subheading')}</p>
        </div>
      </section>
      <section className="w-full bg-background px-margin-desktop py-space-xl">
        <div className="mx-auto max-w-7xl">
          <ModelCatalog models={models} />
        </div>
      </section>
      <section className="sticky bottom-0 z-40 w-full bg-surface-container-lowest/95 px-margin-desktop py-space-md shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-space-sm">
          {quota && (
            <span
              className={`rounded-full px-space-md py-2 text-label-lg font-semibold ${
                quota.remainingToday === 0
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-primary-fixed text-on-primary-fixed'
              }`}
            >
              {t('quotaBadge', { remaining: quota.remainingToday, limit: quota.limit })}
            </span>
          )}
          {quotaLoadFailed && (
            <span className="flex items-center gap-space-sm rounded-full bg-error-container px-space-md py-2 text-label-lg font-semibold text-on-error-container">
              {t('quotaLoadError')}
              <button
                type="button"
                onClick={() => setQuotaRetryToken((current) => current + 1)}
                className="underline"
              >
                {t('quotaRetryButton')}
              </button>
            </span>
          )}
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
              disabled={isGenerating || quota?.remainingToday === 0 || quotaLoadFailed}
              className="flex w-full items-center justify-center gap-space-sm rounded-full bg-primary px-space-xl py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg disabled:opacity-60 sm:w-auto"
            >
              <span>{t('generateButton')}</span>
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </button>
          </div>
          {generateError && <p className="text-center text-body-sm text-error">{generateError}</p>}
        </div>
      </section>
    </div>
  )
}
