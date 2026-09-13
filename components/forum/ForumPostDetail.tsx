'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { ForumPost } from '@/lib/forum'

export default function ForumPostDetail({ id }: { id: string }) {
  const t = useTranslations('Forum')
  const { user } = useAuth()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reason, setReason] = useState('')
  const [reportMessage, setReportMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/forum/posts/${id}`).then((response) => {
      if (!response.ok) {
        setNotFound(true)
        return
      }
      response.json().then(setPost)
    })
  }, [id])

  async function handleSubmitReport() {
    const response = await fetch(`/api/forum/posts/${id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (!response.ok) {
      setReportMessage(t('Report.genericError'))
      return
    }
    setReportMessage(t('Report.successMessage'))
    setShowReportForm(false)
    setReason('')
  }

  return (
    <article className="mx-auto max-w-3xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
      <Link href="/forum" className="text-label-md font-semibold text-primary hover:underline">
        {t('Detail.backLink')}
      </Link>
      {notFound && (
        <div className="mt-space-lg">
          <h1 className="text-headline-md font-bold text-on-surface">{t('Detail.notFoundTitle')}</h1>
          <p className="mt-space-xs text-body-md text-on-surface-variant">{t('Detail.notFoundBody')}</p>
        </div>
      )}
      {post && (
        <>
          <h1 className="mt-space-md text-headline-lg font-bold text-on-surface">{post.title}</h1>
          <p className="mt-space-xs whitespace-pre-wrap text-body-md text-on-surface">{post.body}</p>

          {user && (
            <div className="mt-space-lg">
              {!showReportForm && !reportMessage && (
                <button
                  type="button"
                  onClick={() => setShowReportForm(true)}
                  className="text-label-sm font-semibold text-on-surface-variant hover:underline"
                >
                  {t('Report.reportButton')}
                </button>
              )}
              {showReportForm && (
                <div className="space-y-2">
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t('Report.reasonPlaceholder')}
                    rows={3}
                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-body-sm text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    disabled={!reason.trim()}
                    className="rounded-full bg-primary px-6 py-2 text-label-md text-on-primary disabled:opacity-60"
                  >
                    {t('Report.submitButton')}
                  </button>
                </div>
              )}
              {reportMessage && <p className="text-label-sm text-on-surface-variant">{reportMessage}</p>}
            </div>
          )}
        </>
      )}
    </article>
  )
}
