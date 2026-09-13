'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { ForumPost } from '@/lib/forum'

export default function ForumModerationQueue() {
  const t = useTranslations('Forum.Moderation')
  const [posts, setPosts] = useState<ForumPost[] | null>(null)

  useEffect(() => {
    apiFetch('/forum/moderation/pending')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleDecision(id: number, status: 'published' | 'rejected') {
    await apiFetch(`/forum/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setPosts((current) => current?.filter((post) => post.id !== id) ?? null)
  }

  if (posts === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (posts.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('pendingEmptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {posts.map((post) => (
        <li key={post.id} className="rounded-2xl border border-outline-variant p-space-lg">
          <h3 className="text-headline-sm font-semibold text-on-surface">{post.title}</h3>
          <p className="mt-space-xs whitespace-pre-wrap text-body-sm text-on-surface-variant">{post.body}</p>
          <div className="mt-space-sm flex gap-space-md">
            <button
              type="button"
              onClick={() => handleDecision(post.id, 'published')}
              className="font-semibold text-primary hover:underline"
            >
              {t('approveButton')}
            </button>
            <button
              type="button"
              onClick={() => handleDecision(post.id, 'rejected')}
              className="font-semibold text-error hover:underline"
            >
              {t('rejectButton')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
