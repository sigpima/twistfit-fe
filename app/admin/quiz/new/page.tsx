'use client'

import AdminGate from '@/components/auth/AdminGate'
import QuizQuestionForm from '@/components/admin/QuizQuestionForm'

export default function NewQuizQuestionPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <QuizQuestionForm />
        </section>
      </AdminGate>
    </main>
  )
}
