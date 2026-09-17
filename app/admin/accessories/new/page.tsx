'use client'

import AdminGate from '@/components/auth/AdminGate'
import AccessoryForm from '@/components/admin/AccessoryForm'

export default function NewAccessoryPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <AccessoryForm />
        </section>
      </AdminGate>
    </main>
  )
}
