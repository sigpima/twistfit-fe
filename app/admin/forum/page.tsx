'use client'

import { useTranslations } from 'next-intl'
import AdminGate from '@/components/auth/AdminGate'
import ForumModerationQueue from '@/components/admin/ForumModerationQueue'
import ForumReportQueue from '@/components/admin/ForumReportQueue'

export default function AdminForumPage() {
  const t = useTranslations('Forum.Moderation')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>

          <h2 className="mt-space-xl text-headline-sm font-semibold text-on-surface">{t('pendingTitle')}</h2>
          <div className="mt-space-md">
            <ForumModerationQueue />
          </div>

          <h2 className="mt-space-xl text-headline-sm font-semibold text-on-surface">{t('reportsTitle')}</h2>
          <div className="mt-space-md">
            <ForumReportQueue />
          </div>
        </section>
      </AdminGate>
    </main>
  )
}
