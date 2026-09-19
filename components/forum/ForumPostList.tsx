'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { renderMarkdown } from '@/lib/markdown'
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

  async function handleToggleLike(postId: number) {
    const response = await apiFetch(`/forum/posts/${postId}/like`, { method: 'POST' })
    if (!response.ok) return
    const { liked, likeCount } = (await response.json()) as { liked: boolean; likeCount: number }
    setPosts(
      (current) =>
        current?.map((post) => (post.id === postId ? { ...post, likedByMe: liked, likeCount } : post)) ?? null
    )
  }

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
        <ul className="mx-auto mt-space-lg flex max-w-xl flex-col gap-space-lg">
          {posts.map((post) => (
            <li
              key={post.id}
              className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm"
            >
              <div className="flex items-center gap-space-sm p-space-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-label-lg font-bold text-on-primary">
                  {post.authorName.trim().charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-label-lg font-semibold text-on-surface">{post.authorName}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {t(`categories.${post.category}`)} · {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="" className="aspect-square w-full object-cover" />
              )}

              <div className="flex items-center gap-space-sm px-space-md pt-space-md">
                <button
                  type="button"
                  onClick={() => handleToggleLike(post.id)}
                  aria-pressed={post.likedByMe}
                  aria-label={post.likedByMe ? t('Like.likedButton', { count: post.likeCount }) : t('Like.likeButton', { count: post.likeCount })}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    aria-hidden="true"
                    style={post.likedByMe ? { fontVariationSettings: "'FILL' 1", color: 'var(--color-error)' } : undefined}
                  >
                    favorite
                  </span>
                </button>
                <Link
                  href={`/forum/${post.id}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                    chat_bubble_outline
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(post.id)}
                  aria-pressed={post.bookmarkedByMe}
                  aria-label={post.bookmarkedByMe ? t('Bookmark.savedAriaLabel') : t('Bookmark.saveAriaLabel')}
                  className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
                >
                  <span
                    className="material-symbols-outlined text-[24px]"
                    aria-hidden="true"
                    style={
                      post.bookmarkedByMe
                        ? { fontVariationSettings: "'FILL' 1", color: 'var(--color-primary)' }
                        : undefined
                    }
                  >
                    bookmark
                  </span>
                </button>
              </div>

              <div className="px-space-md pb-space-md">
                <p className="text-label-md font-semibold text-on-surface">
                  {post.likeCount} {t('Public.likesLabel')}
                </p>
                <p className="mt-space-xs text-body-sm text-on-surface">
                  <Link href={`/forum/${post.id}`} className="font-semibold text-on-surface hover:underline">
                    {post.authorName}
                  </Link>{' '}
                  <span className="font-semibold">{post.title}</span>
                </p>
                <div
                  className="prose prose-sm mt-space-xs max-w-none text-body-sm text-on-surface-variant"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
                />
                {post.commentCount > 0 && (
                  <Link
                    href={`/forum/${post.id}`}
                    className="mt-space-xs inline-block text-label-sm text-on-surface-variant hover:underline"
                  >
                    {t('Public.viewAllComments', { count: post.commentCount })}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
