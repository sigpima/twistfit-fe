'use client'

import AdminGate from '@/components/auth/AdminGate'
import ModelForm from '@/components/admin/ModelForm'

export default function NewModelPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <ModelForm />
        </section>
      </AdminGate>
    </main>
  )
}
