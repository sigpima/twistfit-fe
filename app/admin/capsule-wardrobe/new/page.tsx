'use client'

import AdminGate from '@/components/auth/AdminGate'
import CapsuleForm from '@/components/admin/CapsuleForm'

export default function NewCapsuleSetPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <CapsuleForm />
        </section>
      </AdminGate>
    </main>
  )
}
