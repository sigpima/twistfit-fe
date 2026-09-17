'use client'

import { useTranslations } from 'next-intl'
import AdminGate from '@/components/auth/AdminGate'
import TaxonomyGroupList from '@/components/admin/TaxonomyGroupList'

export default function AdminTaxonomyPage() {
  const t = useTranslations('Admin.TaxonomyGroupList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <h1 className="mb-6 text-headline-md font-bold text-on-surface">{t('title')}</h1>
          <TaxonomyGroupList />
        </section>
      </AdminGate>
    </main>
  )
}
