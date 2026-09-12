'use client'

import { useTranslations } from 'next-intl'
import QuizFlow from '@/components/personal-color/QuizFlow'
import { QUIZ_QUESTIONS } from '@/lib/personalColorQuiz'

export default function QuizPage() {
  const t = useTranslations('PersonalColor.Quiz')

  return (
    <main className="w-full bg-surface px-margin py-space-xl sm:px-margin-desktop">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="text-headline-lg text-on-surface">{t('pageTitle')}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {t('pageSubtitle', { count: QUIZ_QUESTIONS.length })}
        </p>
      </div>
      <QuizFlow />
    </main>
  )
}
