'use client'

import AdminGate from '@/components/auth/AdminGate'
import TeamForm from '@/components/admin/TeamForm'

export default function NewTeamMemberPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <TeamForm />
        </section>
      </AdminGate>
    </main>
  )
}
