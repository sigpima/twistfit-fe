'use client'

import { useEffect, useState } from 'react'
import ForumPostDetail from '@/components/forum/ForumPostDetail'

export default function ForumPostPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then((resolved) => setId(resolved.id))
  }, [params])

  return <main className="w-full bg-surface">{id && <ForumPostDetail id={id} />}</main>
}
