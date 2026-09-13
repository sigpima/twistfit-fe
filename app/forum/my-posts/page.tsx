'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AuthGate from '@/components/auth/AuthGate'
import MyForumPostList from '@/components/forum/MyForumPostList'

export default function MyForumPostsPage() {
  const t = useTranslations('Forum')

  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('MyPosts.title')}</h1>
            <Link
              href="/forum/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('MyPosts.newButton')}
            </Link>
          </div>
          <MyForumPostList />
        </section>
      </AuthGate>
    </main>
  )
}
