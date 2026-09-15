'use client'

import { useTranslations } from 'next-intl'
import AuthGate from '@/components/auth/AuthGate'
import SavedForumPostList from '@/components/forum/SavedForumPostList'

export default function SavedForumPostsPage() {
  const t = useTranslations('Forum')

  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <h1 className="mb-6 text-headline-md font-bold text-on-surface">{t('Saved.title')}</h1>
          <SavedForumPostList />
        </section>
      </AuthGate>
    </main>
  )
}
