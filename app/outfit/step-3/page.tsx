import type { Metadata } from 'next'
import Step3PageContent from '@/components/outfit/step3/Step3PageContent'

export const metadata: Metadata = {
  alternates: { canonical: '/outfit/step-1' },
}

export default function Step3Page() {
  return <Step3PageContent />
}
