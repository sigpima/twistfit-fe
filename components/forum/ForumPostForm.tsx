'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { apiFetch } from '@/lib/apiClient'
import { FORUM_CATEGORIES, type ForumCategory, type ForumPost } from '@/lib/forum'
import { FORM_INPUT_CLASS } from '@/lib/formFieldStyles'
import { IMAGE_INPUT_ACCEPT, isAllowedImageType } from '@/lib/imageUpload'

const inputClass = FORM_INPUT_CLASS

export default function ForumPostForm({ initialPost }: { initialPost?: ForumPost }) {
  const t = useTranslations('Forum')
  const router = useRouter()
  const isEditing = Boolean(initialPost)

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [category, setCategory] = useState<ForumCategory>(initialPost?.category ?? FORUM_CATEGORIES[0])
  const [body, setBody] = useState(initialPost?.body ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(initialPost?.imageUrl ?? null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isAllowedImageType(file.type)) {
      setErrors((current) => ({ ...current, image: t('PostForm.imageInvalidTypeError') }))
      return
    }

    setUploadingImage(true)
    setErrors((current) => ({ ...current, image: '' }))

    const uploadUrlResponse = await apiFetch(
      `/forum/upload-url?content_type=${encodeURIComponent(file.type)}`,
      { method: 'POST' }
    )
    if (!uploadUrlResponse.ok) {
      setUploadingImage(false)
      setErrors((current) => ({ ...current, image: t('PostForm.imageUploadError') }))
      return
    }
    const { uploadUrl, imageUrl: resolvedUrl } = (await uploadUrlResponse.json()) as {
      uploadUrl: string
      blobPath: string
      imageUrl: string
    }

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': file.type },
      body: file,
    })
    setUploadingImage(false)
    if (!putResponse.ok) {
      setErrors((current) => ({ ...current, image: t('PostForm.imageUploadError') }))
      return
    }
    setImageUrl(resolvedUrl)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const requestBody = { title, body, category, imageUrl }

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
        <span id="forum-body-label" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.body')}
        </span>
        <RichTextEditor
          value={body}
          onChange={setBody}
          labelId="forum-body-label"
          uploadUrlEndpoint="/forum/upload-url"
        />
        {errors.body && <p className="text-label-sm text-error">{errors.body}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="forum-image" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.image')}
        </label>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-40 w-40 rounded-xl object-cover" />
        )}
        <input
          id="forum-image"
          type="file"
          accept={IMAGE_INPUT_ACCEPT}
          onChange={handleImageChange}
          disabled={uploadingImage}
        />
        {uploadingImage && <p className="text-label-sm text-on-surface-variant">{t('PostForm.imageUploading')}</p>}
        {imageUrl && !uploadingImage && (
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="text-label-sm font-semibold text-error hover:underline"
          >
            {t('PostForm.removeImageButton')}
          </button>
        )}
        {errors.image && (
          <p role="alert" className="text-label-sm text-error">
            {errors.image}
          </p>
        )}
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
