'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import {
  ACCESSORY_CATEGORIES,
  ACCESSORY_OCCASION_TAGS,
  ACCESSORY_STYLE_TAGS,
  ACCESSORY_TONE_TAGS,
  type AccessoryProduct,
} from '@/lib/accessories'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

type FormValues = {
  name: string
  affiliateLink: string
  imageUrl: string
  category: string
  styleTags: string[]
  occasionTags: string[]
  toneTags: string[]
}

type TagField = 'styleTags' | 'occasionTags' | 'toneTags'

type Suggestion = {
  category: string
  styleTags: string[]
  occasionTags: string[]
  toneTags: string[]
  blobUrl: string
}

type FlowState =
  | { step: 'pick' }
  | { step: 'uploading' }
  | { step: 'form'; values: FormValues }
  | { step: 'saving'; values: FormValues }
  | { step: 'error' }

function valuesFromAccessory(accessory: AccessoryProduct): FormValues {
  return {
    name: accessory.name,
    affiliateLink: accessory.affiliateLink,
    imageUrl: accessory.imageUrl,
    category: accessory.category,
    styleTags: accessory.styleTags,
    occasionTags: accessory.occasionTags,
    toneTags: accessory.toneTags,
  }
}

function valuesFromSuggestion(suggestion: Suggestion): FormValues {
  return {
    name: '',
    affiliateLink: '',
    imageUrl: suggestion.blobUrl,
    category: suggestion.category,
    styleTags: suggestion.styleTags,
    occasionTags: suggestion.occasionTags,
    toneTags: suggestion.toneTags,
  }
}

export default function AccessoryForm({ initialAccessory }: { initialAccessory?: AccessoryProduct }) {
  const t = useTranslations('Admin.AccessoryForm')
  const router = useRouter()
  const isEditing = Boolean(initialAccessory)

  const [state, setState] = useState<FlowState>(
    initialAccessory ? { step: 'form', values: valuesFromAccessory(initialAccessory) } : { step: 'pick' }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setState({ step: 'uploading' })

    const uploadUrlResponse = await apiFetch('/accessories/upload-url', { method: 'POST' })
    if (!uploadUrlResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const { uploadUrl, blobPath } = (await uploadUrlResponse.json()) as { uploadUrl: string; blobPath: string }

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!putResponse.ok) {
      setState({ step: 'error' })
      return
    }

    const suggestResponse = await apiFetch('/accessories/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blobPath }),
    })
    if (!suggestResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const suggestion = (await suggestResponse.json()) as Suggestion
    setState({ step: 'form', values: valuesFromSuggestion(suggestion) })
  }

  function updateValues(patch: Partial<FormValues>) {
    if (state.step !== 'form') return
    setState({ step: 'form', values: { ...state.values, ...patch } })
  }

  function toggleTag(field: TagField, tag: string) {
    if (state.step !== 'form') return
    const current = state.values[field]
    updateValues({
      [field]: current.includes(tag) ? current.filter((existing) => existing !== tag) : [...current, tag],
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.step !== 'form') return
    const { values } = state
    setState({ step: 'saving', values })
    setErrors({})

    const response = await apiFetch(isEditing ? `/accessories/${initialAccessory!.id}` : '/accessories', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (response.status === 401 || response.status === 403) {
      setState({ step: 'form', values })
      setErrors({ form: t('unauthorizedError') })
      return
    }

    if (!response.ok) {
      setState({ step: 'form', values })
      setErrors({ form: t('genericError') })
      return
    }

    router.push('/admin/accessories')
  }

  if (state.step === 'pick') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-surface-container-lowest p-8 text-center shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-primary">cloud_upload</span>
        <label htmlFor="accessoryUploadInput" className="cursor-pointer text-headline-sm font-semibold text-on-surface">
          {t('pickFileTitle')}
        </label>
        <p className="text-body-sm text-on-surface-variant">{t('pickFileHint')}</p>
        <input id="accessoryUploadInput" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  if (state.step === 'uploading') {
    return <p className="text-center text-body-md text-on-surface-variant">{t('uploading')}</p>
  }

  if (state.step === 'error') {
    return <p className="text-center text-body-md text-error">{t('errorMessage')}</p>
  }

  const { values } = state
  const isSaving = state.step === 'saving'

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={values.imageUrl} alt={values.name || 'Ảnh phụ kiện'} className="mx-auto h-40 w-40 object-contain" />

      <div className="space-y-1.5">
        <label htmlFor="accessory-name" className="text-label-md font-semibold text-on-surface">
          {t('fields.name')}
        </label>
        <input
          id="accessory-name"
          value={values.name}
          onChange={(event) => updateValues({ name: event.target.value })}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="accessory-affiliate-link" className="text-label-md font-semibold text-on-surface">
          {t('fields.affiliateLink')}
        </label>
        <input
          id="accessory-affiliate-link"
          value={values.affiliateLink}
          onChange={(event) => updateValues({ affiliateLink: event.target.value })}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="accessory-category" className="text-label-md font-semibold text-on-surface">
          {t('fields.category')}
        </label>
        <select
          id="accessory-category"
          value={values.category}
          onChange={(event) => updateValues({ category: event.target.value })}
          className={inputClass}
        >
          {ACCESSORY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`categories.${category}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <span className="text-label-md font-semibold text-on-surface">{t('fields.styleTags')}</span>
        <div className="flex flex-wrap gap-2">
          {ACCESSORY_STYLE_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={values.styleTags.includes(tag)}
                onChange={() => toggleTag('styleTags', tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-label-md font-semibold text-on-surface">{t('fields.occasionTags')}</span>
        <div className="flex flex-wrap gap-2">
          {ACCESSORY_OCCASION_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={values.occasionTags.includes(tag)}
                onChange={() => toggleTag('occasionTags', tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-label-md font-semibold text-on-surface">{t('fields.toneTags')}</span>
        <div className="flex flex-wrap gap-2">
          {ACCESSORY_TONE_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={values.toneTags.includes(tag)}
                onChange={() => toggleTag('toneTags', tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      {errors.form && <p className="text-label-sm text-error">{errors.form}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
      >
        {isSaving ? t('saving') : isEditing ? t('submitEdit') : t('submitCreate')}
      </button>
    </form>
  )
}
