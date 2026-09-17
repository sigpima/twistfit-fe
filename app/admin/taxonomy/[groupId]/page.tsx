'use client'

import { use } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import TaxonomyGroupDetail from '@/components/admin/TaxonomyGroupDetail'

export default function AdminTaxonomyGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <TaxonomyGroupDetail groupId={Number(groupId)} />
        </section>
      </AdminGate>
    </main>
  )
}
