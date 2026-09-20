'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAuth } from '@/components/auth/AuthProvider'
import { getAnonymousQuizResult } from '@/lib/quizResultStorage'
import ColorProfileCard from '@/components/personal-color/ColorProfileCard'
import ColorInsights from '@/components/personal-color/ColorInsights'
import { ColorMetricsDetail } from '@/components/personal-color/ColorMetricsSection'
import RecommendationsSection from '@/components/personal-color/RecommendationsSection'
import AnonymousResultBanner from '@/components/personal-color/AnonymousResultBanner'
import type { AxisValue, SubSeason } from '@/lib/db'

type LoadedResult = {
  subSeason: SubSeason
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
  hueScore?: number | null
  valueScore?: number | null
  chromaScore?: number | null
}

type ResultState = { status: 'loading' } | { status: 'empty' } | { status: 'found'; result: LoadedResult }

export default function ResultPageContent() {
  const t = useTranslations('PersonalColor.Result.Page')
  const { user, isHydrated } = useAuth()
  const [state, setState] = useState<ResultState>({ status: 'loading' })

  useEffect(() => {
    if (!isHydrated) return
    let cancelled = false

    async function loadResult() {
      if (user) {
        const response = await apiFetch('/quiz-attempts/me')
        if (cancelled) return
        if (response.ok) {
          const data = (await response.json()) as LoadedResult | null
          if (data) {
            setState({ status: 'found', result: data })
            return
          }
        }
      }
      if (!cancelled) {
        const anonymous = getAnonymousQuizResult()
        setState(anonymous ? { status: 'found', result: anonymous } : { status: 'empty' })
      }
    }

    loadResult()
    return () => {
      cancelled = true
    }
  }, [user, isHydrated])

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5 sm:items-center">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#7b89ba]/15 text-lg text-[#7b89ba] shadow-sm">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#304461] sm:text-3xl">{t('heading')}</h1>
              <p className="mt-0.5 text-xs font-normal text-[#304461]/80 sm:text-sm">{t('subheading')}</p>
            </div>
          </div>
          <div className="self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs">
              <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
              <span>{t('accuracyBadge')}</span>
            </span>
          </div>
        </div>
      </div>
      {state.status === 'loading' && (
        <p className="text-center text-sm text-[#304461]/70">{t('loadingResult')}</p>
      )}
      {state.status === 'empty' && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#7b89ba]/15 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-bold text-[#304461]">{t('emptyStateTitle')}</h2>
          <p className="max-w-md text-sm text-[#304461]/75">{t('emptyStateBody')}</p>
          <Link
            href="/personal-color/quiz"
            className="mt-2 flex items-center gap-2 rounded-2xl bg-[#304461] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#233247]"
          >
            {t('emptyStateCta')}
          </Link>
        </div>
      )}
      {state.status === 'found' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {!user && <AnonymousResultBanner />}
          <div className="flex flex-col gap-6 lg:col-span-7">
            <ColorProfileCard result={state.result} />
            <ColorInsights subSeason={state.result.subSeason} />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-5">
            <ColorMetricsDetail result={state.result} />
            <RecommendationsSection subSeason={state.result.subSeason} />
          </div>
        </div>
      )}
    </main>
  )
}
