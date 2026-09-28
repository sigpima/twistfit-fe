'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { BlogPost } from '@/lib/db'
import { CATEGORY_PRESENTATION } from './categoryPresentation'

export default function BlogRelatedPosts({ posts }: { posts: BlogPost[] }) {
  const t = useTranslations('Blog.RelatedPosts')
  const tCategory = useTranslations('Blog.ArticleGrid')

  if (posts.length === 0) return null

  return (
    <aside
      aria-label={t('ariaLabel')}
      className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-space-md overflow-y-auto pb-space-lg"
    >
      <span className="text-label-sm font-bold uppercase tracking-widest text-primary">{t('heading')}</span>
      <ul className="flex flex-col gap-space-md">
        {posts.map((post) => {
          const presentation = CATEGORY_PRESENTATION[post.category]
          return (
            <li key={post.id}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex gap-space-sm rounded-2xl bg-surface-container-lowest p-space-sm shadow-sm transition-all hover:shadow-md"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex min-w-0 flex-col justify-center gap-0.5">
                  <span className={`text-label-sm font-semibold ${presentation.colorClass}`}>
                    {tCategory(`categories.${presentation.translationKey}`)}
                  </span>
                  <h2 className="line-clamp-2 text-body-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
                    {post.title}
                  </h2>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
