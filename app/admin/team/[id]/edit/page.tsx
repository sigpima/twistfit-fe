'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import TeamForm from '@/components/admin/TeamForm'
import { apiFetch } from '@/lib/apiClient'
import type { TeamMember } from '@/lib/team'

export default function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const [member, setMember] = useState<TeamMember | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      apiFetch(`/team/${id}`)
        .then((response) => response.json())
        .then(setMember)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {member && <TeamForm initialMember={member} />}
        </section>
      </AdminGate>
    </main>
  )
}
