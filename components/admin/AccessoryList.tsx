'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { AccessoryProduct } from '@/lib/accessories'

export default function AccessoryList() {
  const t = useTranslations('Admin.AccessoryList')
  const [accessories, setAccessories] = useState<AccessoryProduct[] | null>(null)

  useEffect(() => {
    apiFetch('/accessories')
      .then((response) => response.json())
      .then(setAccessories)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/accessories/${id}`, { method: 'DELETE' })
    setAccessories((current) => current?.filter((item) => item.id !== id) ?? null)
  }

  if (accessories === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (accessories.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnName')}</th>
          <th className="py-2">{t('columnCategory')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {accessories.map((accessory) => (
          <tr key={accessory.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{accessory.name}</td>
            <td className="py-3 text-on-surface-variant">{accessory.category}</td>
            <td className="py-3 text-right">
              <Link
                href={`/admin/accessories/${accessory.id}/edit`}
                className="mr-4 font-semibold text-primary hover:underline"
              >
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(accessory.id)}
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
