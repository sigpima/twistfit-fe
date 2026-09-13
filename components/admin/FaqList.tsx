'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { FaqItem } from '@/lib/faq'

export default function FaqList() {
  const t = useTranslations('Admin.FaqList')
  const [items, setItems] = useState<FaqItem[] | null>(null)

  useEffect(() => {
    apiFetch('/faq')
      .then((response) => response.json())
      .then(setItems)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/faq/${id}`, { method: 'DELETE' })
    setItems((current) => current?.filter((item) => item.id !== id) ?? null)
  }

  if (items === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (items.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnQuestion')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{item.question}</td>
            <td className="py-3 text-right">
              <Link href={`/admin/faq/${item.id}/edit`} className="mr-4 font-semibold text-primary hover:underline">
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="font-semibold text-error hover:underline"
              >
                {t('deleteButton')}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
