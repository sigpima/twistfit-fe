'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { BLOG_CATEGORIES, type BlogPost } from '@/lib/db'
import { CATEGORY_PRESENTATION } from './categoryPresentation'

const CATEGORY_FILTERS = ['all', ...BLOG_CATEGORIES] as const

export default function BlogArticleGrid({ posts }: { posts: BlogPost[] }) {
  const t = useTranslations('Blog.ArticleGrid')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({})

  const visiblePosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return posts.filter((post) => {
      const matchesCategory = activeCategory === 'all' || post.category === activeCategory
      const matchesSearch = !query || post.title.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [posts, activeCategory, searchQuery])

  return (
    <section className="mb-space-xl">
      <div className="mb-space-xl flex flex-col justify-between gap-space-md rounded-2xl bg-surface-container-lowest/70 p-space-md shadow-sm backdrop-blur-xl lg:flex-row lg:items-center md:p-space-lg">
        <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs lg:pb-0">
          {CATEGORY_FILTERS.map((category) => {
            const translationKey = category === 'all' ? 'all' : CATEGORY_PRESENTATION[category].translationKey
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 whitespace-nowrap rounded-full px-space-md py-space-xs text-label-lg transition-all ${
                  activeCategory === category
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {t(`categories.${translationKey}`)}
              </button>
            )
          })}
        </div>
        <div className="flex w-full items-center gap-space-sm lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-full bg-surface-container-low/80 py-space-xs pl-9 pr-space-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/70 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      <div className="mb-space-lg flex items-center justify-between">
        <div>
          <span className="text-label-sm font-bold uppercase tracking-widest text-primary">
            {t('sectionKicker')}
          </span>
          <h3 className="text-headline-md font-bold text-on-surface">{t('sectionHeading')}</h3>
        </div>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest py-space-xl text-center shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
          <h4 className="mt-space-xs text-headline-sm font-semibold text-on-surface">
            {t('noResultsTitle')}
          </h4>
          <p className="mt-1 text-body-md text-on-surface-variant">{t('noResultsBody')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post) => {
            const isBookmarked = Boolean(bookmarked[post.id])
            const presentation = CATEGORY_PRESENTATION[post.category]
            return (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImageUrl}
                    alt={post.coverImageAlt || post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-space-sm left-space-sm">
                    <span
                      className={`rounded-full bg-surface-container-lowest/90 px-space-sm py-0.5 text-label-sm font-semibold shadow-xs backdrop-blur-md ${presentation.colorClass}`}
                    >
                      {t(`categories.${presentation.translationKey}`)}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={t('bookmarkAriaLabel')}
                    aria-pressed={isBookmarked}
                    onClick={() =>
                      setBookmarked((current) => ({ ...current, [post.id]: !current[post.id] }))
                    }
                    className={`absolute right-space-sm top-space-sm flex h-8 w-8 items-center justify-center rounded-full shadow-xs backdrop-blur-md transition-colors ${
                      isBookmarked
                        ? 'bg-secondary-container text-secondary'
                        : 'bg-surface-container-lowest/90 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isBookmarked ? 'bookmark_added' : 'bookmark'}
                    </span>
                  </button>
                </div>
                <div className="flex flex-1 flex-col justify-between p-space-md">
                  <div>
                    <div className="mb-space-xs flex items-center gap-space-xs text-label-sm text-on-surface-variant">
                      <span className="font-semibold text-primary">TwistFit</span>
                      <span>•</span>
                      <span className="rounded bg-surface-container px-space-xs py-0.5 font-medium text-on-surface-variant">
                        {post.publishedAt}
                      </span>
                    </div>
                    <h4 className="mb-space-xs line-clamp-2 text-title-md font-bold text-on-surface transition-colors group-hover:text-primary">
                      {post.title}
                    </h4>
                    <p className="line-clamp-3 text-body-sm text-on-surface-variant">{post.excerpt}</p>
                  </div>
                  <div className="mt-space-sm flex items-center justify-end pt-space-md">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-0.5 text-label-md font-semibold text-primary hover:underline"
                    >
                      {t('readNowLink')}{' '}
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
