'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { QuizQuestion } from '@/lib/db'

export default function QuizQuestionList() {
  const t = useTranslations('Admin.QuizList')
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)

  useEffect(() => {
    apiFetch('/quiz-questions')
      .then((response) => response.json())
      .then(setQuestions)
  }, [])

  async function persistOrder(a: QuizQuestion, b: QuizQuestion) {
    await Promise.all([
      apiFetch(`/quiz-questions/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: a.questionText, sortOrder: b.sortOrder, options: a.options }),
      }),
      apiFetch(`/quiz-questions/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: b.questionText, sortOrder: a.sortOrder, options: b.options }),
      }),
    ])
  }

  function move(index: number, direction: -1 | 1) {
    setQuestions((current) => {
      if (!current) return current
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= current.length) return current

      const a = current[index]
      const b = current[targetIndex]
      const next = [...current]
      next[index] = { ...b, sortOrder: a.sortOrder }
      next[targetIndex] = { ...a, sortOrder: b.sortOrder }
      next.sort((x, y) => x.sortOrder - y.sortOrder)

      void persistOrder(a, b)
      return next
    })
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/quiz-questions/${id}`, { method: 'DELETE' })
    setQuestions((current) => current?.filter((question) => question.id !== id) ?? null)
  }

  if (questions === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (questions.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <ul className="space-y-3">
      {questions.map((question, index) => (
        <li
          key={question.id}
          className="flex items-center justify-between rounded-2xl bg-surface-container-lowest p-4 shadow-sm"
        >
          <span className="text-body-md text-on-surface">{question.questionText}</span>
          <div className="flex items-center gap-3 text-label-md font-semibold">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className="text-primary hover:underline disabled:opacity-30"
            >
              {t('moveUp')}
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === questions.length - 1}
              className="text-primary hover:underline disabled:opacity-30"
            >
              {t('moveDown')}
            </button>
            <Link href={`/admin/quiz/${question.id}/edit`} className="text-primary hover:underline">
              {t('editButton')}
            </Link>
            <button type="button" onClick={() => handleDelete(question.id)} className="text-error hover:underline">
              {t('deleteButton')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
