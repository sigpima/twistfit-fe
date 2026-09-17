'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import ImagePickerDialog from '@/components/admin/ImagePickerDialog'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { apiFetch } from '@/lib/apiClient'
import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from '@/lib/db'
import { slugify } from '@/lib/slugify'
import { FORM_INPUT_CLASS } from '@/lib/formFieldStyles'

const inputClass = FORM_INPUT_CLASS

export default function BlogPostForm({ initialPost }: { initialPost?: BlogPost }) {
  const t = useTranslations('Admin.BlogForm')
  const router = useRouter()
  const isEditing = Boolean(initialPost)

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing)
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.coverImageUrl ?? '')
  const [category, setCategory] = useState<BlogCategory>(initialPost?.category ?? BLOG_CATEGORIES[0])
  const [authorName, setAuthorName] = useState(initialPost?.authorName ?? '')
  const [isFeatured, setIsFeatured] = useState(initialPost?.isFeatured ?? false)
  const [publishedAt, setPublishedAt] = useState(initialPost?.publishedAt ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [coverDialogOpen, setCoverDialogOpen] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugManuallyEdited) {
      setSlug(slugify(value))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = {
      title,
      slug,
      excerpt,
      content,
      coverImageUrl,
      category,
      authorName: authorName.trim() || null,
      isFeatured,
      publishedAt,
    }

    const response = await apiFetch(isEditing ? `/blog/${initialPost!.id}` : '/blog', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSubmitting(false)

    if (response.status === 401 || response.status === 403) {
      setErrors({ form: t('unauthorizedError') })
      return
    }

    if (!response.ok) {
      setErrors({ form: t('genericError') })
      return
    }

    router.push('/admin/blog')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="post-title" className="text-label-md font-semibold text-on-surface">
          {t('fields.title')}
        </label>
        <input
          id="post-title"
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          className={inputClass}
        />
        {errors.title && <p className="text-label-sm text-error">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="post-slug" className="text-label-md font-semibold text-on-surface">
          {t('fields.slug')}
        </label>
        <input
          id="post-slug"
          value={slug}
          onChange={(event) => {
            setSlugManuallyEdited(true)
            setSlug(event.target.value)
          }}
          className={inputClass}
        />
        {errors.slug && <p className="text-label-sm text-error">{errors.slug}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="post-excerpt" className="text-label-md font-semibold text-on-surface">
          {t('fields.excerpt')}
        </label>
        <textarea
          id="post-excerpt"
          rows={2}
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          className={inputClass}
        />
        {errors.excerpt && <p className="text-label-sm text-error">{errors.excerpt}</p>}
      </div>

      <div className="space-y-1.5">
        <span id="post-content-label" className="text-label-md font-semibold text-on-surface">
          {t('fields.content')}
        </span>
        <RichTextEditor
          value={content}
          onChange={setContent}
          labelId="post-content-label"
          uploadUrlEndpoint="/blog/upload-url"
        />
        {errors.content && <p className="text-label-sm text-error">{errors.content}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-label-md font-semibold text-on-surface">{t('fields.coverImageUrl')}</span>
          {coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImageUrl} alt="" className="h-32 w-full rounded-xl object-cover" />
          )}
          <button
            type="button"
            onClick={() => setCoverDialogOpen(true)}
            className="rounded-full bg-surface px-4 py-2 text-label-md font-semibold text-on-surface"
          >
            {t('coverImageButton')}
          </button>
          {errors.coverImageUrl && <p className="text-label-sm text-error">{errors.coverImageUrl}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="post-category" className="text-label-md font-semibold text-on-surface">
            {t('fields.category')}
          </label>
          <select
            id="post-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as BlogCategory)}
            className={inputClass}
          >
            {BLOG_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(`categories.${value}`)}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-label-sm text-error">{errors.category}</p>}
        </div>
      </div>

      <ImagePickerDialog
        open={coverDialogOpen}
        requireAlt={false}
        uploadUrlEndpoint="/blog/upload-url"
        onCancel={() => setCoverDialogOpen(false)}
        onConfirm={({ url }) => {
          setCoverImageUrl(url)
          setCoverDialogOpen(false)
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="post-author" className="text-label-md font-semibold text-on-surface">
            {t('fields.authorName')}
          </label>
          <input
            id="post-author"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="post-published-at" className="text-label-md font-semibold text-on-surface">
            {t('fields.publishedAt')}
          </label>
          <input
            id="post-published-at"
            type="date"
            value={publishedAt}
            onChange={(event) => setPublishedAt(event.target.value)}
            className={inputClass}
          />
          {errors.publishedAt && <p className="text-label-sm text-error">{errors.publishedAt}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 text-label-md font-semibold text-on-surface">
        <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
        {t('fields.isFeatured')}
      </label>

      {errors.form && <p className="text-label-sm text-error">{errors.form}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
      >
        {isEditing ? t('submitEdit') : t('submitCreate')}
      </button>
    </form>
  )
}
