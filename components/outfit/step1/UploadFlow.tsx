'use client'

import { useTranslations } from 'next-intl'
import { useState, type ChangeEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'

type Suggestion = {
  category: string
  styleTags: string[]
  occasionTags: string[]
  dominantColors: string[]
  blobUrl: string
}

type FlowState =
  | { step: 'pick' }
  | { step: 'uploading' }
  | { step: 'review'; blobPath: string; suggestion: Suggestion }
  | { step: 'saving'; blobPath: string; suggestion: Suggestion }
  | { step: 'saved' }
  | { step: 'error' }

const CATEGORIES = ['ao-thun', 'ao-so-mi', 'quan-jean', 'dam', 'ao-khoac'] as const
const STYLE_TAGS = ['casual', 'minimalist', 'street', 'formal'] as const
const OCCASION_TAGS = ['hang-ngay', 'di-lam', 'du-tiec', 'di-bien'] as const

const CATEGORY_KEYS: Record<(typeof CATEGORIES)[number], 'aoThun' | 'aoSoMi' | 'quanJean' | 'dam' | 'aoKhoac'> = {
  'ao-thun': 'aoThun',
  'ao-so-mi': 'aoSoMi',
  'quan-jean': 'quanJean',
  dam: 'dam',
  'ao-khoac': 'aoKhoac',
}

export default function UploadFlow({ onUploaded }: { onUploaded: () => void }) {
  const t = useTranslations('Outfit.Step1.UploadFlow')
  const [state, setState] = useState<FlowState>({ step: 'pick' })

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setState({ step: 'uploading' })

    const uploadUrlResponse = await apiFetch('/wardrobe/upload-url', { method: 'POST' })
    if (!uploadUrlResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const { uploadUrl, blobPath } = (await uploadUrlResponse.json()) as { uploadUrl: string; blobPath: string }

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': file.type },
      body: file,
    })
    if (!putResponse.ok) {
      setState({ step: 'error' })
      return
    }

    const suggestResponse = await apiFetch('/wardrobe/items/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blobPath }),
    })
    if (!suggestResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const suggestion = (await suggestResponse.json()) as Suggestion
    setState({ step: 'review', blobPath, suggestion })
  }

  function updateSuggestion(patch: Partial<Suggestion>) {
    if (state.step !== 'review') return
    setState({ ...state, suggestion: { ...state.suggestion, ...patch } })
  }

  async function handleSave() {
    if (state.step !== 'review') return
    const { suggestion } = state
    setState({ step: 'saving', blobPath: state.blobPath, suggestion })

    const response = await apiFetch('/wardrobe/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blobUrl: suggestion.blobUrl,
        category: suggestion.category,
        styleTags: suggestion.styleTags,
        occasionTags: suggestion.occasionTags,
        dominantColors: suggestion.dominantColors,
      }),
    })

    if (!response.ok) {
      setState({ step: 'error' })
      return
    }
    setState({ step: 'saved' })
    onUploaded()
  }

  if (state.step === 'pick') {
    return (
      <div className="flex flex-col items-center gap-space-md rounded-3xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-primary">cloud_upload</span>
        <label
          htmlFor="wardrobeUploadInput"
          className="cursor-pointer text-headline-sm font-semibold text-on-surface"
        >
          {t('pickFileTitle')}
        </label>
        <p className="text-body-sm text-on-surface-variant">{t('pickFileHint')}</p>
        <input id="wardrobeUploadInput" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  if (state.step === 'uploading') {
    return <p className="text-center text-body-md text-on-surface-variant">{t('uploading')}</p>
  }

  if (state.step === 'error') {
    return <p className="text-center text-body-md text-error">{t('errorMessage')}</p>
  }

  if (state.step === 'saved') {
    return <p className="text-center text-body-md text-primary">{t('savedMessage')}</p>
  }

  const { suggestion } = state
  const isSaving = state.step === 'saving'

  return (
    <div className="flex flex-col gap-space-md rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={suggestion.blobUrl} alt="" className="mx-auto h-48 w-48 object-contain" />

      <div className="flex flex-col gap-1">
        <span className="text-label-md font-semibold text-on-surface">{t('categoryLabel')}</span>
        <select
          value={suggestion.category}
          onChange={(event) => updateSuggestion({ category: event.target.value })}
          className="rounded-xl border border-outline px-space-sm py-2"
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`categories.${CATEGORY_KEYS[category]}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-label-md font-semibold text-on-surface">{t('styleTagsLabel')}</span>
        <div className="flex flex-wrap gap-2">
          {STYLE_TAGS.map((tag) => {
            const isChecked = suggestion.styleTags.includes(tag)
            return (
              <label key={tag} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    updateSuggestion({
                      styleTags: isChecked
                        ? suggestion.styleTags.filter((existing) => existing !== tag)
                        : [...suggestion.styleTags, tag],
                    })
                  }
                />
                {tag}
              </label>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-label-md font-semibold text-on-surface">{t('occasionTagsLabel')}</span>
        <div className="flex flex-wrap gap-2">
          {OCCASION_TAGS.map((tag) => {
            const isChecked = suggestion.occasionTags.includes(tag)
            return (
              <label key={tag} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    updateSuggestion({
                      occasionTags: isChecked
                        ? suggestion.occasionTags.filter((existing) => existing !== tag)
                        : [...suggestion.occasionTags, tag],
                    })
                  }
                />
                {tag}
              </label>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-full bg-primary px-space-lg py-space-sm text-label-lg font-semibold text-on-primary disabled:opacity-60"
      >
        {isSaving ? t('saving') : t('saveButton')}
      </button>
    </div>
  )
}
