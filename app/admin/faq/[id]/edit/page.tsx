'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import FaqForm from '@/components/admin/FaqForm'
import { apiFetch } from '@/lib/apiClient'
import type { FaqItem } from '@/lib/faq'

export default function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<FaqItem | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      apiFetch(`/faq/${id}`)
        .then((response) => response.json())
        .then(setItem)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {item && <FaqForm initialItem={item} />}
        </section>
      </AdminGate>
    </main>
  )
}
