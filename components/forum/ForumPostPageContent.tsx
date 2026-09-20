'use client'

import ForumPostDetail from '@/components/forum/ForumPostDetail'

export default function ForumPostPageContent({ id }: { id: string }) {
  return (
    <main className="w-full bg-surface">
      <ForumPostDetail id={id} />
    </main>
  )
}
