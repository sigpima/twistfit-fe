'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { BlogPost } from '@/lib/db'
import { estimateReadingMinutes } from '@/lib/readingTime'
import { CATEGORY_PRESENTATION } from './categoryPresentation'

export default function BlogFeaturedArticle({ post }: { post: BlogPost }) {
  const t = useTranslations('Blog.FeaturedArticle')
  const tCategories = useTranslations('Blog.ArticleGrid.categories')
  const presentation = CATEGORY_PRESENTATION[post.category]
  const readingMinutes = estimateReadingMinutes(post.content)

  return (
    <section className="mb-space-xl">
      <div className="group grid grid-cols-1 overflow-hidden rounded-3xl bg-surface-container-lowest/90 shadow-md backdrop-blur-xl transition-all duration-300 hover:shadow-xl lg:grid-cols-12">
        <div className="relative min-h-[340px] overflow-hidden md:min-h-[440px] lg:col-span-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt={post.coverImageAlt || post.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/50 via-transparent to-transparent lg:hidden" />
          <div className="absolute left-space-md top-space-md flex flex-wrap gap-space-xs">
            <span className="flex items-center gap-space-xs rounded-full bg-secondary px-space-md py-space-xs text-label-md text-on-secondary shadow-sm">
              <span className="material-symbols-outlined text-[16px]">stars</span>
              {t('featuredBadge')}
            </span>
            <span className="rounded-full bg-surface-container-lowest/80 px-space-md py-space-xs text-label-md text-primary shadow-sm backdrop-blur-md">
              {tCategories(presentation.translationKey)}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between bg-surface-container-lowest/95 p-space-lg md:p-space-xl lg:col-span-5">
          <div>
            <div className="mb-space-sm flex items-center gap-space-sm text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1 font-semibold text-primary">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                {post.publishedAt}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                {readingMinutes} phút đọc
              </span>
            </div>
            <h2 className="mb-space-md text-headline-md font-bold leading-snug tracking-tight text-on-surface transition-colors group-hover:text-primary md:text-headline-lg">
              {post.title}
            </h2>
            <p className="mb-space-lg text-body-md leading-relaxed text-on-surface-variant">{post.excerpt}</p>
          </div>
          <div className="pt-space-md">
            <div className="flex items-center justify-between gap-space-md">
              {post.authorName ? (
                <div className="flex items-center gap-space-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container font-bold text-secondary">
                    {post.authorName
                      .split(' ')
                      .slice(-2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <p className="text-label-md font-semibold text-on-surface">Bởi {post.authorName}</p>
                </div>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  title={t('bookmarkTitle')}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-secondary-container hover:text-secondary"
                >
                  <span className="material-symbols-outlined text-[20px]">bookmark</span>
                </button>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-space-xs rounded-full bg-primary px-space-md py-space-xs text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container"
                >
                  <span>{t('readMoreButton')}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
