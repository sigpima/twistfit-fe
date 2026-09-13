'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import ModelForm from '@/components/admin/ModelForm'
import type { CatalogModel } from '@/lib/modelCatalog'

export default function EditModelPage({ params }: { params: Promise<{ id: string }> }) {
  const [model, setModel] = useState<CatalogModel | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/model-catalog/${id}`)
        .then((response) => response.json())
        .then(setModel)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {model && <ModelForm initialModel={model} />}
        </section>
      </AdminGate>
    </main>
  )
}
