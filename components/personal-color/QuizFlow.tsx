'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { QuizQuestion, Season } from '@/lib/db'
import { computeSeasonResult } from '@/lib/computeSeasonResult'

export default function QuizFlow({ questions }: { questions: QuizQuestion[] }) {
  const t = useTranslations('PersonalColor.Quiz')
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<(Season | null)[]>(() => Array(questions.length).fill(null))

  const totalSteps = questions.length
  const question = questions[currentStep]
  const selectedSeason = answers[currentStep]
  const isLastStep = currentStep === totalSteps - 1

  function selectOption(season: Season) {
    setAnswers((prev) => prev.map((value, index) => (index === currentStep ? season : value)))
  }

  function handleAdvance() {
    if (isLastStep) {
      const finalAnswers = answers.filter((value): value is Season => value !== null)
      const season = computeSeasonResult(finalAnswers)
      void fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season }),
      }).catch(() => {})
      router.push('/personal-color/result')
      return
    }
    setCurrentStep((step) => step + 1)
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-label-sm text-on-surface-variant">
          <span>{t('badgeLabel')}</span>
          <span>{t('questionCounter', { current: currentStep + 1, total: totalSteps })}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      <h2 className="text-headline-sm font-bold text-on-surface">{question.questionText}</h2>
      <div className="mt-5 space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedSeason === option.season
          return (
            <button
              key={option.label}
              type="button"
              data-quiz-option="true"
              onClick={() => selectOption(option.season)}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-body-md transition-colors ${
                isSelected
                  ? 'border-primary bg-primary-fixed text-on-surface'
                  : 'border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>{option.label}</span>
              {isSelected && (
                <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
          disabled={currentStep === 0}
          className="text-label-md font-semibold text-on-surface-variant disabled:opacity-0"
        >
          {t('backButton')}
        </button>
        <button
          type="button"
          onClick={handleAdvance}
          disabled={selectedSeason === null}
          className="rounded-full bg-primary px-7 py-3 text-label-lg text-on-primary transition-all hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastStep ? t('viewResultButton') : t('nextButton')}
        </button>
      </div>
    </div>
  )
}
