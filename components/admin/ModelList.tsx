'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { CatalogModel } from '@/lib/modelCatalog'

export default function ModelList() {
  const t = useTranslations('Admin.ModelList')
  const [models, setModels] = useState<CatalogModel[] | null>(null)

  useEffect(() => {
    fetch('/api/model-catalog')
      .then((response) => response.json())
      .then(setModels)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await fetch(`/api/model-catalog/${id}`, { method: 'DELETE' })
    setModels((current) => current?.filter((model) => model.id !== id) ?? null)
  }

  if (models === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (models.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnName')}</th>
          <th className="py-2">{t('columnUndertone')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {models.map((model) => (
          <tr key={model.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{model.name}</td>
            <td className="py-3 text-on-surface-variant">{model.undertone}</td>
            <td className="py-3 text-right">
              <Link
                href={`/admin/model-catalog/${model.id}/edit`}
                className="mr-4 font-semibold text-primary hover:underline"
              >
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(model.id)}
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
