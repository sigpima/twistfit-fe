'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ForumPost } from '@/lib/forum'

export default function MyForumPostList() {
  const t = useTranslations('Forum')
  const [posts, setPosts] = useState<ForumPost[] | null>(null)

  useEffect(() => {
    fetch('/api/forum/posts/mine')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('MyPosts.deleteConfirm'))) return
    await fetch(`/api/forum/posts/${id}`, { method: 'DELETE' })
    setPosts((current) => current?.filter((post) => post.id !== id) ?? null)
  }

  if (posts === null) {
    return <p className="text-body-md text-on-surface-variant">{t('MyPosts.loading')}</p>
  }

  if (posts.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('MyPosts.emptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {posts.map((post) => (
        <li key={post.id} className="rounded-2xl border border-outline-variant p-space-lg">
          <div className="flex items-center justify-between gap-space-md">
            <h2 className="text-headline-sm font-semibold text-on-surface">{post.title}</h2>
            <span className="shrink-0 rounded-full bg-surface-container px-space-md py-space-xs text-label-sm text-on-surface-variant">
              {t(`MyPosts.status.${post.status}`)}
            </span>
          </div>
          <div className="mt-space-sm flex gap-space-md">
            <Link href={`/forum/${post.id}/edit`} className="font-semibold text-primary hover:underline">
              {t('MyPosts.editButton')}
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(post.id)}
              className="font-semibold text-error hover:underline"
            >
              {t('MyPosts.deleteButton')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
