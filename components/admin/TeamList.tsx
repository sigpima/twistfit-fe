'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { TeamMember } from '@/lib/team'

export default function TeamList() {
  const t = useTranslations('Admin.TeamList')
  const [members, setMembers] = useState<TeamMember[] | null>(null)

  useEffect(() => {
    apiFetch('/team')
      .then((response) => response.json())
      .then(setMembers)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/team/${id}`, { method: 'DELETE' })
    setMembers((current) => current?.filter((member) => member.id !== id) ?? null)
  }

  if (members === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (members.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnName')}</th>
          <th className="py-2">{t('columnRole')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <tr key={member.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{member.name}</td>
            <td className="py-3 text-on-surface-variant">{member.role}</td>
            <td className="py-3 text-right">
              <Link href={`/admin/team/${member.id}/edit`} className="mr-4 font-semibold text-primary hover:underline">
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(member.id)}
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
