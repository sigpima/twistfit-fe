'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { ForumPost } from '@/lib/forum'

export default function SavedForumPostList() {
  const t = useTranslations('Forum')
  const [posts, setPosts] = useState<ForumPost[] | null>(null)

  useEffect(() => {
    apiFetch('/forum/posts/saved')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleToggleBookmark(postId: number) {
    const response = await apiFetch(`/forum/posts/${postId}/bookmark`, { method: 'POST' })
    if (!response.ok) return
    const { bookmarked } = (await response.json()) as { bookmarked: boolean }
    if (!bookmarked) {
      setPosts((current) => current?.filter((post) => post.id !== postId) ?? null)
    }
  }

  if (posts === null) {
    return <p className="text-body-md text-on-surface-variant">{t('Saved.loading')}</p>
  }

  if (posts.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('Saved.emptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {posts.map((post) => (
        <li
          key={post.id}
          className="flex items-center gap-space-md rounded-2xl border border-outline-variant p-space-lg"
        >
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <Link
              href={`/forum/${post.id}`}
              className="text-headline-sm font-semibold text-on-surface hover:underline"
            >
              {post.title}
            </Link>
            <p className="mt-space-xs text-label-sm text-on-surface-variant">
              {t(`categories.${post.category}`)} · {post.authorName}
            </p>
            <p className="mt-space-xs text-label-sm text-on-surface-variant">
              {post.likeCount} {t('Public.likesLabel')} · {post.commentCount} {t('Public.commentsLabel')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggleBookmark(post.id)}
            aria-pressed={post.bookmarkedByMe}
            aria-label={post.bookmarkedByMe ? t('Bookmark.savedAriaLabel') : t('Bookmark.saveAriaLabel')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
          >
            <span
              className="material-symbols-outlined text-[22px]"
              aria-hidden="true"
              style={
                post.bookmarkedByMe
                  ? { fontVariationSettings: "'FILL' 1", color: '#16a34a' }
                  : undefined
              }
            >
              bookmark
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
