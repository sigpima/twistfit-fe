'use client'

import { useTranslations } from 'next-intl'
import AdminGate from '@/components/auth/AdminGate'
import ContactMessageList from '@/components/admin/ContactMessageList'

export default function AdminContactPage() {
  const t = useTranslations('Admin.ContactList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
          <div className="mt-space-lg">
            <ContactMessageList />
          </div>
        </section>
      </AdminGate>
    </main>
  )
}
