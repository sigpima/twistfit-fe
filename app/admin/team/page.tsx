'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AdminGate from '@/components/auth/AdminGate'
import TeamList from '@/components/admin/TeamList'

export default function AdminTeamPage() {
  const t = useTranslations('Admin.TeamList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <Link
              href="/admin/team/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('newButton')}
            </Link>
          </div>
          <TeamList />
        </section>
      </AdminGate>
    </main>
  )
}
