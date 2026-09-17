'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { slugify } from '@/lib/slugify'
import type { TaxonomyGroup, TaxonomyValue } from '@/lib/taxonomy'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function TaxonomyGroupDetail({ groupId }: { groupId: number }) {
  const t = useTranslations('Admin.TaxonomyGroupDetail')
  const [group, setGroup] = useState<TaxonomyGroup | null | undefined>(undefined)
  const [groupLabel, setGroupLabel] = useState('')
  const [newValueLabel, setNewValueLabel] = useState('')
  const [editingValueId, setEditingValueId] = useState<number | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/taxonomy')
      .then((response) => response.json())
      .then((groups: TaxonomyGroup[]) => {
        const match = groups.find((candidate) => candidate.id === groupId) ?? null
        setGroup(match)
        if (match) setGroupLabel(match.label)
      })
  }, [groupId])

  async function handleSaveGroupLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!group) return
    setError('')
    const response = await apiFetch(`/taxonomy/groups/${group.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: group.key, label: groupLabel.trim() }),
    })
    if (!response.ok) {
      setError(t('genericError'))
      return
    }
    const updated = (await response.json()) as TaxonomyGroup
    setGroup(updated)
  }

  async function handleAddValue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!group) return
    setError('')
    const response = await apiFetch(`/taxonomy/groups/${group.id}/values`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: slugify(newValueLabel), label: newValueLabel.trim() }),
    })
    if (!response.ok) {
      setError(t('genericError'))
      return
    }
    const created = (await response.json()) as TaxonomyValue
    setGroup({ ...group, values: [...group.values, created] })
    setNewValueLabel('')
  }

  function startEditing(value: TaxonomyValue) {
    setEditingValueId(value.id)
    setEditingLabel(value.label)
  }

  async function handleSaveValue(value: TaxonomyValue) {
    if (!group) return
    setError('')
    const response = await apiFetch(`/taxonomy/values/${value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: value.key, label: editingLabel.trim() }),
    })
    if (!response.ok) {
      setError(t('genericError'))
      return
    }
    const updated = (await response.json()) as TaxonomyValue
    setGroup({ ...group, values: group.values.map((v) => (v.id === updated.id ? updated : v)) })
    setEditingValueId(null)
  }

  async function handleDeleteValue(value: TaxonomyValue) {
    if (!group || !window.confirm(t('deleteConfirm'))) return
    setError('')
    const response = await apiFetch(`/taxonomy/values/${value.id}`, { method: 'DELETE' })
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { detail?: string } | null
      setError(body?.detail ?? t('genericError'))
      return
    }
    setGroup({ ...group, values: group.values.filter((v) => v.id !== value.id) })
  }

  if (group === undefined) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (group === null) {
    return <p className="text-body-md text-on-surface-variant">{t('notFound')}</p>
  }

  return (
    <div className="space-y-8">
      <form className="flex items-end gap-3" onSubmit={handleSaveGroupLabel}>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="group-label" className="text-label-md font-semibold text-on-surface">
            {t('groupLabelField')}
          </label>
          <input
            id="group-label"
            value={groupLabel}
            onChange={(event) => setGroupLabel(event.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
        >
          {t('saveGroupButton')}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-headline-sm font-semibold text-on-surface">{t('valuesTitle')}</h2>
        <table className="w-full text-left text-body-md">
          <tbody>
            {group.values.map((value) => (
              <tr key={value.id} className="border-b border-outline-variant/50">
                <td className="py-3">
                  {editingValueId === value.id ? (
                    <input
                      value={editingLabel}
                      onChange={(event) => setEditingLabel(event.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <span className="font-semibold text-on-surface">{value.label}</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  {editingValueId === value.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveValue(value)}
                        className="mr-4 font-semibold text-primary hover:underline"
                      >
                        {t('saveButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingValueId(null)}
                        className="font-semibold text-on-surface-variant hover:underline"
                      >
                        {t('cancelButton')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditing(value)}
                        className="mr-4 font-semibold text-primary hover:underline"
                      >
                        {t('editButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteValue(value)}
                        className="font-semibold text-error hover:underline"
                      >
                        {t('deleteButton')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="flex items-end gap-3" onSubmit={handleAddValue}>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="new-value-label" className="text-label-md font-semibold text-on-surface">
            {t('newValueLabel')}
          </label>
          <input
            id="new-value-label"
            value={newValueLabel}
            onChange={(event) => setNewValueLabel(event.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={!newValueLabel.trim()}
          className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
        >
          {t('addValueButton')}
        </button>
      </form>

      {error && <p className="text-label-sm text-error">{error}</p>}
    </div>
  )
}
