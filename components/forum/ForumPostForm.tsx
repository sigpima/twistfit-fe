'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { FORUM_CATEGORIES, type ForumCategory, type ForumPost } from '@/lib/forum'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function ForumPostForm({ initialPost }: { initialPost?: ForumPost }) {
  const t = useTranslations('Forum')
  const router = useRouter()
  const isEditing = Boolean(initialPost)

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [category, setCategory] = useState<ForumCategory>(initialPost?.category ?? FORUM_CATEGORIES[0])
  const [body, setBody] = useState(initialPost?.body ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const requestBody = { title, body, category }

    const response = await apiFetch(isEditing ? `/forum/posts/${initialPost!.id}` : '/forum/posts', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    setSubmitting(false)

    if (response.status === 401 || response.status === 403) {
      setErrors({ form: t('PostForm.unauthorizedError') })
      return
    }

    if (!response.ok) {
      setErrors({ form: t('PostForm.genericError') })
      return
    }

    router.push('/forum/my-posts')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="forum-title" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.title')}
        </label>
        <input
          id="forum-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClass}
        />
        {errors.title && <p className="text-label-sm text-error">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="forum-category" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.category')}
        </label>
        <select
          id="forum-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as ForumCategory)}
          className={inputClass}
        >
          {FORUM_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {t(`categories.${value}`)}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-label-sm text-error">{errors.category}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="forum-body" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.body')}
        </label>
        <textarea
          id="forum-body"
          rows={8}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className={inputClass}
        />
        {errors.body && <p className="text-label-sm text-error">{errors.body}</p>}
      </div>

      {errors.form && <p className="text-label-sm text-error">{errors.form}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
      >
        {isEditing ? t('PostForm.submitEdit') : t('PostForm.submitCreate')}
      </button>
    </form>
  )
}
