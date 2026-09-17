'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { SEASON_PROFILES } from '@/lib/seasonProfiles'
import type { SubSeason } from '@/lib/db'

type QuizResult = { subSeason: SubSeason } | null

export default function PersonalColorSection() {
  const t = useTranslations('Collection.PersonalColor')
  const [result, setResult] = useState<QuizResult>()

  useEffect(() => {
    apiFetch('/quiz-attempts/me')
      .then((response) => (response.ok ? response.json() : null))
      .then(setResult)
  }, [])

  return (
    <section className="rounded-3xl bg-surface-container-lowest p-6 shadow-[0_12px_36px_rgba(4,28,55,0.06)] sm:p-8">
      <h2 className="mb-6 text-headline-sm font-bold text-on-surface">{t('heading')}</h2>
      {result === undefined && <p className="text-body-md text-on-surface-variant">{t('loading')}</p>}
      {result === null && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-8 text-center">
          <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
          <Link
            href="/personal-color/quiz"
            className="rounded-full bg-primary px-6 py-2.5 text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container"
          >
            {t('emptyStateCta')}
          </Link>
        </div>
      )}
      {result && (
        <div className="flex flex-col items-start gap-4 rounded-2xl bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-headline-sm font-bold text-on-surface">
              {SEASON_PROFILES[result.subSeason].displayName}
            </p>
            <div className="mt-2 flex gap-1.5">
              {SEASON_PROFILES[result.subSeason].paletteHex.map((hex) => (
                <span key={hex} className="h-6 w-6 rounded-full shadow-sm" style={{ backgroundColor: hex }} />
              ))}
            </div>
          </div>
          <Link
            href="/personal-color/result"
            className="shrink-0 rounded-full bg-primary px-6 py-2.5 text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container"
          >
            {t('viewDetailButton')}
          </Link>
        </div>
      )}
    </section>
  )
}
