'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { slugify } from '@/lib/slugify'
import type { TaxonomyGroup } from '@/lib/taxonomy'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function TaxonomyGroupList() {
  const t = useTranslations('Admin.TaxonomyGroupList')
  const [groups, setGroups] = useState<TaxonomyGroup[] | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/taxonomy')
      .then((response) => response.json())
      .then(setGroups)
  }, [])

  async function handleAddGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await apiFetch('/taxonomy/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: slugify(newLabel), label: newLabel.trim() }),
    })
    if (!response.ok) {
      setError(t('genericError'))
      return
    }
    const created = (await response.json()) as TaxonomyGroup
    setGroups((current) => [...(current ?? []), created])
    setNewLabel('')
  }

  if (groups === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  return (
    <div className="space-y-6">
      {groups.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
      ) : (
        <table className="w-full text-left text-body-md">
          <thead>
            <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
              <th className="py-2">{t('columnLabel')}</th>
              <th className="py-2">{t('columnValueCount')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-b border-outline-variant/50">
                <td className="py-3 font-semibold text-on-surface">{group.label}</td>
                <td className="py-3 text-on-surface-variant">{group.values.length}</td>
                <td className="py-3 text-right">
                  <Link href={`/admin/taxonomy/${group.id}`} className="font-semibold text-primary hover:underline">
                    {t('manageButton')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form className="flex items-end gap-3" onSubmit={handleAddGroup}>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="new-group-label" className="text-label-md font-semibold text-on-surface">
            {t('newGroupLabel')}
          </label>
          <input
            id="new-group-label"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={!newLabel.trim()}
          className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
        >
          {t('addGroupButton')}
        </button>
      </form>
      {error && <p className="text-label-sm text-error">{error}</p>}
    </div>
  )
}
