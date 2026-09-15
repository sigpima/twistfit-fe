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
            <li key={post.id} className="rounded-2xl border border-outline-variant p-space-lg">
              <Link
                href={`/forum/${post.id}`}
                className="text-headline-sm font-semibold text-on-surface hover:underline"
              >
                {post.title}
              </Link>
              <p className="mt-space-xs text-label-sm text-on-surface-variant">{t(`categories.${post.category}`)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
