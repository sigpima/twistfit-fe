'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { TryOnJob } from '@/lib/tryon'

export default function OutfitResultsSection() {
  const t = useTranslations('Collection.OutfitResults')
  const [jobs, setJobs] = useState<TryOnJob[] | null>(null)

  useEffect(() => {
    apiFetch('/tryon')
      .then((response) => (response.ok ? response.json() : []))
      .then((data: TryOnJob[]) => setJobs(data.filter((job) => job.status === 'done')))
  }, [])

  return (
    <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-[0_12px_36px_rgba(4,28,55,0.06)] sm:p-8">
      <h2 className="mb-6 text-headline-sm font-bold text-on-surface">{t('heading')}</h2>
      {jobs === null && <p className="text-body-md text-on-surface-variant">{t('loading')}</p>}
      {jobs !== null && jobs.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-8 text-center">
          <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
          <Link
            href="/outfit/step-1"
            className="rounded-full bg-primary px-6 py-2.5 text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container"
          >
            {t('emptyStateCta')}
          </Link>
        </div>
      )}
      {jobs !== null && jobs.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {jobs.map((job) => (
            <div key={job.id} className="overflow-hidden rounded-2xl bg-surface shadow-sm">
              <div className="grid grid-cols-2 gap-px bg-outline-variant">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.resultFrontBlobUrl ?? ''}
                  alt={t('frontImageAlt')}
                  className="aspect-[3/4] w-full object-cover"
                />
                {job.resultSideBlobUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.resultSideBlobUrl}
                    alt={t('sideImageAlt')}
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[3/4] w-full bg-surface-container" />
                )}
              </div>
              <p className="px-3 py-2 text-label-sm text-on-surface-variant">
                {new Date(job.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
