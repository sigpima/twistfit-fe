import QuizPageContent from '@/components/personal-color/QuizPageContent'
import { apiFetch } from '@/lib/apiClient'
import type { QuizQuestion } from '@/lib/db'

export default async function QuizPage() {
  const response = await apiFetch('/quiz-questions', { cache: 'no-store' })
  const questions = response.ok ? ((await response.json()) as QuizQuestion[]) : []
  return <QuizPageContent questions={questions} />
}
