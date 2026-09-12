'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

type FetchStatus = 'idle' | 'loading' | 'success'

export default function ProductUrlFetcher() {
  const t = useTranslations('Outfit.Step1.ProductUrlFetcher')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<FetchStatus>('idle')
  const [isInvalid, setIsInvalid] = useState(false)

  function handleFetch() {
    if (url.trim() === '') {
      setIsInvalid(true)
      return
    }
    setStatus('loading')
    setTimeout(() => {
      setStatus('success')
      setTimeout(() => {
        setStatus('idle')
      }, 2000)
    }, 1200)
  }

  const buttonLabel =
    status === 'loading' ? t('buttonLoading') : status === 'success' ? t('buttonSuccess') : t('buttonIdle')
  const buttonIcon = status === 'loading' ? 'refresh' : status === 'success' ? 'check' : 'cloud_sync'

  return (
    <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[20px] text-primary">link</span>
          <span className="text-label-lg font-semibold text-on-surface">{t('title')}</span>
        </div>
        <div className="flex items-center gap-space-xs text-body-sm text-outline">
          <span className="h-1.5 w-1.5 rounded-full bg-outline" />
          <span>{t('supportedStores')}</span>
        </div>
      </div>
      <div className="flex items-center gap-space-sm">
        <input
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value)
            setIsInvalid(false)
          }}
          placeholder={t('placeholder')}
          aria-invalid={isInvalid}
          className={`flex-1 rounded-xl px-space-md py-space-sm text-body-md text-on-surface shadow-inner transition-colors placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none ${
            isInvalid ? 'bg-error-container/30' : 'bg-surface-container-low'
          }`}
        />
        <button
          type="button"
          onClick={handleFetch}
          className="flex shrink-0 items-center gap-space-xs rounded-xl bg-primary px-space-md py-space-sm font-semibold text-label-lg text-on-primary shadow-sm transition-colors hover:bg-primary-container"
        >
          <span
            className={`material-symbols-outlined text-[18px] ${status === 'loading' ? 'animate-spin' : ''}`}
          >
            {buttonIcon}
          </span>
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  )
}
