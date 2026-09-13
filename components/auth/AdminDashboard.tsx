'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'

export default function AdminDashboard() {
  const t = useTranslations('Admin')
  const { user } = useAuth()

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-space-xl lg:py-24">
      <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_12px_36px_rgba(4,28,55,0.08)] lg:p-10">
        <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
        {user && <p className="mt-1 text-body-sm text-on-surface-variant">{t('welcome', { name: user.name })}</p>}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Link
            href="/admin/blog"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('blogCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('blogCardDescription')}</p>
          </Link>
          <Link
            href="/admin/quiz"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('quizCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('quizCardDescription')}</p>
          </Link>
        </div>
      </div>
    </section>
  )
}
