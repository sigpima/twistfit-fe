'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import ForumPostList from '@/components/forum/ForumPostList'

export default function ForumPageContent() {
  const t = useTranslations('Forum')

  return (
    <main className="w-full bg-surface">
      <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
        <div className="mb-6 text-center">
          <h1 className="text-headline-lg font-bold text-on-surface">{t('Public.title')}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">{t('Public.subtitle')}</p>
        </div>
        <nav className="mb-6 flex flex-wrap justify-center gap-space-md text-label-md font-semibold">
          <Link href="/forum/new" className="text-primary hover:underline">
            {t('Public.newPostLink')}
          </Link>
          <Link href="/forum/my-posts" className="text-primary hover:underline">
            {t('Public.myPostsLink')}
          </Link>
          <Link href="/forum/saved" className="text-primary hover:underline">
            {t('Public.savedLink')}
          </Link>
        </nav>
        <ForumPostList />
      </section>
    </main>
  )
}
