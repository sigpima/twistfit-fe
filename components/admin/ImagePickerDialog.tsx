'use client'

import { useTranslations } from 'next-intl'
import { useState, type ChangeEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export interface ImagePickerResult {
  url: string
  alt: string
}

export default function ImagePickerDialog({
  open,
  requireAlt = true,
  uploadUrlEndpoint,
  onCancel,
  onConfirm,
}: {
  open: boolean
  requireAlt?: boolean
  uploadUrlEndpoint: string
  onCancel: () => void
  onConfirm: (result: ImagePickerResult) => void
}) {
  const t = useTranslations('Admin.ImagePicker')
  const [mode, setMode] = useState<'link' | 'upload'>('link')
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const uploadUrlResponse = await apiFetch(uploadUrlEndpoint, { method: 'POST' })
    if (!uploadUrlResponse.ok) {
      setUploading(false)
      setError(t('uploadError'))
      return
    }
    const { uploadUrl, imageUrl } = (await uploadUrlResponse.json()) as {
      uploadUrl: string
      blobPath: string
      imageUrl: string
    }

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': file.type },
      body: file,
    })
    setUploading(false)
    if (!putResponse.ok) {
      setError(t('uploadError'))
      return
    }
    setUrl(imageUrl)
  }

  function handleConfirm() {
    onConfirm({ url: url.trim(), alt: alt.trim() })
  }

  const canConfirm = url.trim() !== '' && (!requireAlt || alt.trim() !== '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-surface p-6 shadow-lg">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('link')}
            aria-pressed={mode === 'link'}
            className="rounded-full px-4 py-2 text-label-md font-semibold"
          >
            {t('modeLink')}
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            aria-pressed={mode === 'upload'}
            className="rounded-full px-4 py-2 text-label-md font-semibold"
          >
            {t('modeUpload')}
          </button>
        </div>

        {mode === 'upload' && (
          <div className="space-y-1.5">
            <label htmlFor="image-picker-file" className="text-label-md font-semibold text-on-surface">
              {t('fileLabel')}
            </label>
            <input
              id="image-picker-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && <p className="text-label-sm text-on-surface-variant">{t('uploadingLabel')}</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="image-picker-url" className="text-label-md font-semibold text-on-surface">
            {t('urlLabel')}
          </label>
          <input
            id="image-picker-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className={inputClass}
          />
        </div>

        {requireAlt && (
          <div className="space-y-1.5">
            <label htmlFor="image-picker-alt" className="text-label-md font-semibold text-on-surface">
              {t('altLabel')}
            </label>
            <input
              id="image-picker-alt"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-label-sm text-error">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 text-label-md font-semibold text-on-surface-variant"
          >
            {t('cancelButton')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="rounded-full bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary disabled:opacity-60"
          >
            {t('confirmButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
