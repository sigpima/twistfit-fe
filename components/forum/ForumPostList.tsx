'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { FORUM_CATEGORIES, type ForumCategory, type ForumPost } from '@/lib/forum'

type CategoryFilter = 'all' | ForumCategory

export default function ForumPostList() {
  const t = useTranslations('Forum')
  const [posts, setPosts] = useState<ForumPost[] | null>(null)
  const [category, setCategory] = useState<CategoryFilter>('all')

  useEffect(() => {
    const query = category === 'all' ? '' : `?category=${category}`
    apiFetch(`/forum/posts${query}`)
      .then((response) => response.json())
      .then(setPosts)
  }, [category])

  async function handleToggleBookmark(postId: number) {
    const response = await apiFetch(`/forum/posts/${postId}/bookmark`, { method: 'POST' })
    if (!response.ok) return
    const { bookmarked } = (await response.json()) as { bookmarked: boolean }
    setPosts(
      (current) => current?.map((post) => (post.id === postId ? { ...post, bookmarkedByMe: bookmarked } : post)) ?? null
    )
  }

  const filters: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: t('categoryAll') },
    ...FORUM_CATEGORIES.map((value) => ({ id: value, label: t(`categories.${value}`) })),
  ]

  return (
    <div>
      <div className="relative">
        <div className="flex items-center gap-space-xs overflow-x-auto pb-space-sm">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setCategory(filter.id)}
              className={`shrink-0 rounded-full px-space-lg py-space-sm text-label-lg transition-all duration-200 ${
                category === filter.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-surface to-transparent"
        />
      </div>

      {posts === null && <p className="mt-space-lg text-body-md text-on-surface-variant">{t('Public.loading')}</p>}
      {posts !== null && posts.length === 0 && (
        <p className="mt-space-lg text-body-md text-on-surface-variant">{t('Public.emptyState')}</p>
      )}
      {posts !== null && posts.length > 0 && (
        <ul className="mt-space-lg space-y-space-md">
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
                  style={post.bookmarkedByMe ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  bookmark
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
