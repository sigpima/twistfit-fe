import QuizPageContent from '@/components/personal-color/QuizPageContent'
import { getQuizQuestions } from '@/lib/db'
import { getDb } from '@/lib/getDb'

export default function QuizPage() {
  const questions = getQuizQuestions(getDb())
  return <QuizPageContent questions={questions} />
}
