import type { Metadata } from 'next'
import Step1PageContent from '@/components/outfit/step1/Step1PageContent'

export const metadata: Metadata = {
  alternates: { canonical: '/outfit/step-1' },
}

export default function Step1Page() {
  return <Step1PageContent />
}
