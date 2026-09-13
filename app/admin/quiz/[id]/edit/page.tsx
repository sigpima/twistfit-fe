'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import QuizQuestionForm from '@/components/admin/QuizQuestionForm'
import type { QuizQuestion } from '@/lib/db'

export default function EditQuizQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const [question, setQuestion] = useState<QuizQuestion | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/quiz-questions/${id}`)
        .then((response) => response.json())
        .then(setQuestion)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {question && <QuizQuestionForm initialQuestion={question} />}
        </section>
      </AdminGate>
    </main>
  )
}
