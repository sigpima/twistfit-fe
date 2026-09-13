import QuizPageContent from '@/components/personal-color/QuizPageContent'
import { getDb, getQuizQuestions } from '@/lib/db'

export default function QuizPage() {
  const questions = getQuizQuestions(getDb())
  return <QuizPageContent questions={questions} />
}
