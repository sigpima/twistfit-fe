'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState, type ChangeEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { TaxonomyGroup } from '@/lib/taxonomy'

type Suggestion = {
  attributes: Record<string, string[]>
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

export default function UploadFlow({ onUploaded }: { onUploaded: () => void }) {
  const t = useTranslations('Outfit.Step1.UploadFlow')
  const [state, setState] = useState<FlowState>({ step: 'pick' })
  const [taxonomyGroups, setTaxonomyGroups] = useState<TaxonomyGroup[]>([])

  useEffect(() => {
    let cancelled = false
    apiFetch('/taxonomy').then(async (response) => {
      if (cancelled || !response.ok) return
      setTaxonomyGroups((await response.json()) as TaxonomyGroup[])
    })
    return () => {
      cancelled = true
    }
  }, [])

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
      headers: { 'Content-Type': file.type },
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
    const raw = (await suggestResponse.json()) as Record<string, unknown>
    const { dominantColors, blobUrl, ...attributes } = raw
    setState({
      step: 'review',
      blobPath,
      suggestion: {
        attributes: attributes as Record<string, string[]>,
        dominantColors: dominantColors as string[],
        blobUrl: blobUrl as string,
      },
    })
  }

  function toggleAttributeValue(groupKey: string, valueKey: string) {
    if (state.step !== 'review') return
    const current = state.suggestion.attributes[groupKey] ?? []
    const updated = current.includes(valueKey) ? current.filter((v) => v !== valueKey) : [...current, valueKey]
    setState({
      ...state,
      suggestion: { ...state.suggestion, attributes: { ...state.suggestion.attributes, [groupKey]: updated } },
    })
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
        attributes: suggestion.attributes,
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

      {taxonomyGroups.map((group) => (
        <div key={group.id} className="flex flex-col gap-1">
          <span className="text-label-md font-semibold text-on-surface">{group.label}</span>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const isChecked = (suggestion.attributes[group.key] ?? []).includes(value.key)
              return (
                <label key={value.id} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAttributeValue(group.key, value.key)}
                  />
                  {value.label}
                </label>
              )
            })}
          </div>
        </div>
      ))}

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
