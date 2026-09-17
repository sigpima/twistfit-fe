'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import AccessoryForm from '@/components/admin/AccessoryForm'
import { apiFetch } from '@/lib/apiClient'
import type { AccessoryProduct } from '@/lib/accessories'

export default function EditAccessoryPage({ params }: { params: Promise<{ id: string }> }) {
  const [accessory, setAccessory] = useState<AccessoryProduct | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      apiFetch(`/accessories/${id}`)
        .then((response) => response.json())
        .then(setAccessory)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {accessory && <AccessoryForm initialAccessory={accessory} />}
        </section>
      </AdminGate>
    </main>
  )
}
