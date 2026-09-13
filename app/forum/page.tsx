'use client'

import { useTranslations } from 'next-intl'
import ForumPostList from '@/components/forum/ForumPostList'

export default function ForumPage() {
  const t = useTranslations('Forum')

  return (
    <main className="w-full bg-surface">
      <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
        <div className="mb-6 text-center">
          <h1 className="text-headline-lg font-bold text-on-surface">{t('Public.title')}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">{t('Public.subtitle')}</p>
        </div>
        <ForumPostList />
      </section>
    </main>
  )
}
