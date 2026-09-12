import QuizFlow from '@/components/personal-color/QuizFlow'
import { QUIZ_QUESTIONS } from '@/lib/personalColorQuiz'

export default function QuizPage() {
  return (
    <main className="w-full bg-surface px-margin py-space-xl sm:px-margin-desktop">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="text-headline-lg text-on-surface">Kiểm Tra Personal Color</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Trả lời {QUIZ_QUESTIONS.length} câu hỏi ngắn để xác định nhóm màu mùa phù hợp với bạn.
        </p>
      </div>
      <QuizFlow />
    </main>
  )
}
