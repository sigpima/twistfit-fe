import type { Metadata } from 'next'
import ForumPageContent from '@/components/forum/ForumPageContent'

export const metadata: Metadata = {
  alternates: { canonical: '/forum' },
}

export default function ForumPage() {
  return <ForumPageContent />
}
