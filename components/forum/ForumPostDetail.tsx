'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { apiFetch } from '@/lib/apiClient'
import type { ForumComment, ForumPost } from '@/lib/forum'
import { renderMarkdown } from '@/lib/markdown'

export default function ForumPostDetail({ id }: { id: string }) {
  const t = useTranslations('Forum')
  const { user } = useAuth()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reason, setReason] = useState('')
  const [reportMessage, setReportMessage] = useState<string | null>(null)
  const [comments, setComments] = useState<ForumComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    apiFetch(`/forum/posts/${id}`).then((response) => {
      if (!response.ok) {
        setNotFound(true)
        return
      }
      response.json().then(setPost)
    })
  }, [id])

  useEffect(() => {
    apiFetch(`/forum/posts/${id}/comments`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setComments(Array.isArray(data) ? data : []))
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

  async function handleToggleBookmark() {
    const response = await apiFetch(`/forum/posts/${id}/bookmark`, { method: 'POST' })
    if (!response.ok || !post) return
    const { bookmarked } = (await response.json()) as { bookmarked: boolean }
    setPost({ ...post, bookmarkedByMe: bookmarked })
  }

  async function handleSubmitComment() {
    setSubmittingComment(true)
    const response = await apiFetch(`/forum/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newComment }),
    })
    setSubmittingComment(false)
    if (!response.ok) return
    const comment = (await response.json()) as ForumComment
    setComments((current) => [...current, comment])
    setNewComment('')
  }

  async function handleDeleteComment(commentId: number) {
    const response = await apiFetch(`/forum/comments/${commentId}`, { method: 'DELETE' })
    if (!response.ok) return
    setComments((current) => current.filter((comment) => comment.id !== commentId))
  }

  async function handleDeletePost() {
    if (!window.confirm(t('Detail.deleteConfirm'))) return
    const response = await apiFetch(`/forum/posts/${id}`, { method: 'DELETE' })
    if (!response.ok) return
    const refreshed = await apiFetch(`/forum/posts/${id}`)
    if (refreshed.ok) setPost(await refreshed.json())
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
          <div className="mt-space-md flex items-start justify-between gap-space-md">
            <h1 className="text-headline-lg font-bold text-on-surface">{post.title}</h1>
            {post.canDelete && !post.deletedAt && (
              <button
                type="button"
                onClick={handleDeletePost}
                className="shrink-0 text-label-sm font-semibold text-error hover:underline"
              >
                {t('Detail.deleteButton')}
              </button>
            )}
          </div>
          <p className="mt-space-xs text-label-sm text-on-surface-variant">{post.authorName}</p>

          {post.deletedAt ? (
            <p className="mt-space-md rounded-xl bg-surface-container px-space-md py-space-sm text-body-md text-on-surface-variant">
              {post.deletedByAdmin ? t('Detail.deletedByAdmin') : t('Detail.deletedByAuthor')}
            </p>
          ) : (
            <>
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt=""
                  className="mt-space-md aspect-[4/3] w-full rounded-2xl object-cover"
                />
              )}
              <div
                className="prose mt-space-md max-w-none text-body-md text-on-surface"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
              />
            </>
          )}

          {!post.deletedAt && user && (
            <div className="mt-space-md flex items-center gap-space-sm">
              <button
                type="button"
                onClick={handleToggleLike}
                aria-pressed={post.likedByMe}
                className={`inline-flex items-center gap-1 rounded-full px-space-lg py-space-sm text-label-md font-semibold transition-colors ${
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
              <button
                type="button"
                onClick={handleToggleBookmark}
                aria-pressed={post.bookmarkedByMe}
                className={`inline-flex items-center gap-1 rounded-full px-space-lg py-space-sm text-label-md font-semibold transition-colors ${
                  post.bookmarkedByMe
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                  style={post.bookmarkedByMe ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  bookmark
                </span>
                {post.bookmarkedByMe ? t('Bookmark.savedButton') : t('Bookmark.saveButton')}
              </button>
            </div>
          )}

          {!post.deletedAt && user && (
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

          {!post.deletedAt && (
          <div className="mt-space-xl">
            <h2 className="text-headline-sm font-semibold text-on-surface">{t('Comments.title')}</h2>
            {comments.length === 0 && (
              <p className="mt-space-sm text-body-sm text-on-surface-variant">{t('Comments.emptyState')}</p>
            )}
            <ul className="mt-space-sm space-y-space-sm">
              {comments.map((comment) => (
                <li key={comment.id} className="rounded-xl bg-surface-container p-space-sm">
                  <p className="text-label-sm font-semibold text-on-surface">{comment.authorName}</p>
                  <p className="text-body-sm text-on-surface">{comment.body}</p>
                  {comment.canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="mt-1 text-label-sm font-semibold text-error hover:underline"
                    >
                      {t('Comments.deleteButton')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {user && (
              <div className="mt-space-md space-y-2">
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder={t('Comments.placeholder')}
                  rows={2}
                  className="w-full rounded-xl bg-surface-container px-4 py-3 text-body-sm text-on-surface"
                />
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="rounded-full bg-primary px-6 py-2 text-label-md text-on-primary disabled:opacity-60"
                >
                  {t('Comments.submitButton')}
                </button>
              </div>
            )}
          </div>
          )}
        </>
      )}
    </article>
  )
}
