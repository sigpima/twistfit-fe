'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '../OutfitFlowProvider'

type JobStatus = 'pending' | 'processing' | 'done' | 'failed'
type JobPollResult = {
  status: JobStatus
  resultFrontBlobUrl: string | null
  resultSideBlobUrl: string | null
  errorMessage: string | null
}

export default function ResultPreview() {
  const t = useTranslations('Outfit.Step3.ResultPreview')
  const { jobId } = useOutfitFlow()
  const [job, setJob] = useState<JobPollResult | null>(null)

  useEffect(() => {
    if (jobId === null) return
    let cancelled = false

    async function poll() {
      const response = await apiFetch(`/tryon/${jobId}`)
      if (cancelled || !response.ok) return
      const result = (await response.json()) as JobPollResult
      setJob(result)
      if (result.status === 'pending' || result.status === 'processing') {
        setTimeout(poll, 3000)
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [jobId])

  if (jobId === null) {
    return <p className="text-center text-body-md text-on-surface-variant">{t('noJob')}</p>
  }

  if (!job || job.status === 'pending' || job.status === 'processing') {
    return <p className="text-center text-body-md text-on-surface-variant">{t('processingStatus')}</p>
  }

  if (job.status === 'failed') {
    return <p className="text-center text-body-md text-error">{job.errorMessage ?? t('failedStatus')}</p>
  }

  const frontImageUrl = job.resultFrontBlobUrl ?? '/outfit/flow-overview.png'

  return (
    <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
      <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={frontImageUrl} alt={t('frontImageAlt')} className="h-auto w-full object-contain" />
      </div>
      {job.resultSideBlobUrl && (
        <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={job.resultSideBlobUrl} alt={t('sideImageAlt')} className="h-auto w-full object-contain" />
        </div>
      )}
    </div>
  )
}
