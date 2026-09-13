'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import CapsuleForm from '@/components/admin/CapsuleForm'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

export default function EditCapsuleSetPage({ params }: { params: Promise<{ id: string }> }) {
  const [set, setSet] = useState<CapsuleSet | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/capsule-wardrobe/${id}`)
        .then((response) => response.json())
        .then(setSet)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {set && <CapsuleForm initialSet={set} />}
        </section>
      </AdminGate>
    </main>
  )
}
