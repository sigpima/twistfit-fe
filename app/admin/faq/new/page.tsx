'use client'

import AdminGate from '@/components/auth/AdminGate'
import FaqForm from '@/components/admin/FaqForm'

export default function NewFaqPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <FaqForm />
        </section>
      </AdminGate>
    </main>
  )
}
