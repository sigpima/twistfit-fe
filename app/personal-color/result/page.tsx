import type { Metadata } from 'next'
import ResultPageContent from '@/components/personal-color/ResultPageContent'

export const metadata: Metadata = {
  alternates: { canonical: '/personal-color/quiz' },
}

export default function ResultPage() {
  return <ResultPageContent />
}
