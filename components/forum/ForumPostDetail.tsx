'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { apiFetch } from '@/lib/apiClient'
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
    apiFetch(`/forum/posts/${id}`).then((response) => {
      if (!response.ok) {
        setNotFound(true)
        return
      }
      response.json().then(setPost)
    })
  }, [id])

  async function handleSubmitReport() {
    const response = await apiFetch(`/forum/posts/${id}/report`, {
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

  async function handleToggleLike() {
    const response = await apiFetch(`/forum/posts/${id}/like`, { method: 'POST' })
    if (!response.ok || !post) return
    const { liked, likeCount } = (await response.json()) as { liked: boolean; likeCount: number }
    setPost({ ...post, likedByMe: liked, likeCount })
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
          <p className="mt-space-xs text-label-sm text-on-surface-variant">{post.authorName}</p>
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="mt-space-md aspect-[4/3] w-full rounded-2xl object-cover"
            />
          )}
          <p className="mt-space-md whitespace-pre-wrap text-body-md text-on-surface">{post.body}</p>

          {user && (
            <button
              type="button"
              onClick={handleToggleLike}
              aria-pressed={post.likedByMe}
              className={`mt-space-md inline-flex items-center gap-1 rounded-full px-space-lg py-space-sm text-label-md font-semibold transition-colors ${
                post.likedByMe
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px]"
                aria-hidden="true"
                style={post.likedByMe ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                favorite
              </span>
              {post.likedByMe
                ? t('Like.likedButton', { count: post.likeCount })
                : t('Like.likeButton', { count: post.likeCount })}
            </button>
          )}

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
