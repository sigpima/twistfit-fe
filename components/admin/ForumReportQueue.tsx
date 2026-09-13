'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { ForumReport } from '@/lib/forum'

export default function ForumReportQueue() {
  const t = useTranslations('Forum.Moderation')
  const [reports, setReports] = useState<ForumReport[] | null>(null)

  useEffect(() => {
    apiFetch('/forum/moderation/reports')
      .then((response) => response.json())
      .then(setReports)
  }, [])

  async function handleResolve(id: number) {
    await apiFetch(`/forum/reports/${id}`, { method: 'PATCH' })
    setReports((current) => current?.filter((report) => report.id !== id) ?? null)
  }

  async function handleHide(report: ForumReport) {
    await apiFetch(`/forum/posts/${report.postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'hidden' }),
    })
    setReports(
      (current) =>
        current?.map((item) => (item.id === report.id ? { ...item, postStatus: 'hidden' as const } : item)) ?? null
    )
  }

  async function handleDelete(report: ForumReport) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/forum/posts/${report.postId}`, { method: 'DELETE' })
    setReports((current) => current?.filter((item) => item.postId !== report.postId) ?? null)
  }

  if (reports === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (reports.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('reportsEmptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {reports.map((report) => (
        <li key={report.id} className="rounded-2xl border border-outline-variant p-space-lg">
          <h3 className="text-headline-sm font-semibold text-on-surface">{report.postTitle}</h3>
          <p className="mt-space-xs text-body-sm text-on-surface-variant">
            {t('reasonLabel')}: {report.reason}
          </p>
          <div className="mt-space-sm flex flex-wrap gap-space-md">
            <button
              type="button"
              onClick={() => handleResolve(report.id)}
              className="font-semibold text-primary hover:underline"
            >
              {t('resolveButton')}
            </button>
            {report.postStatus === 'published' && (
              <button
                type="button"
                onClick={() => handleHide(report)}
                className="font-semibold text-on-surface-variant hover:underline"
              >
                {t('hideButton')}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(report)}
              className="font-semibold text-error hover:underline"
            >
              {t('deleteButton')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
