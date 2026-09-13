'use client'

import { useTranslations } from 'next-intl'
import QuizFlow from './QuizFlow'
import type { QuizQuestion } from '@/lib/db'

export default function QuizPageContent({ questions }: { questions: QuizQuestion[] }) {
  const t = useTranslations('PersonalColor.Quiz')

  return (
    <main className="w-full bg-surface px-margin py-space-xl sm:px-margin-desktop">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="text-headline-lg text-on-surface">{t('pageTitle')}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {t('pageSubtitle', { count: questions.length })}
        </p>
      </div>
      <QuizFlow questions={questions} />
    </main>
  )
}
