'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

export default function CapsuleList() {
  const t = useTranslations('Admin.CapsuleList')
  const [sets, setSets] = useState<CapsuleSet[] | null>(null)

  useEffect(() => {
    apiFetch('/capsule-wardrobe')
      .then((response) => response.json())
      .then(setSets)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/capsule-wardrobe/${id}`, { method: 'DELETE' })
    setSets((current) => current?.filter((set) => set.id !== id) ?? null)
  }

  if (sets === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (sets.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnTitle')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {sets.map((set) => (
          <tr key={set.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{set.title}</td>
            <td className="py-3 text-right">
              <Link
                href={`/admin/capsule-wardrobe/${set.id}/edit`}
                className="mr-4 font-semibold text-primary hover:underline"
              >
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(set.id)}
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
