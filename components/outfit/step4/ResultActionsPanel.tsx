'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

export default function ResultActionsPanel() {
  const t = useTranslations('Outfit.Step4.ResultActionsPanel')
  const router = useRouter()

  return (
    <div className="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <h3 className="mb-space-xs text-headline-sm text-on-surface">{t('title')}</h3>
      <p className="mb-space-md text-body-sm text-on-surface-variant">{t('subtitle')}</p>
      <div className="flex flex-col gap-space-sm">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-space-sm rounded-full bg-primary px-space-md py-3.5 text-label-lg text-on-primary shadow-md transition-all duration-300 hover:bg-primary-container hover:shadow-lg"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          {t('downloadButton')}
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-space-sm rounded-full bg-secondary-fixed px-space-md py-3 text-label-lg text-on-secondary-fixed transition-all duration-300 hover:bg-secondary-fixed-dim"
        >
          <span className="material-symbols-outlined text-[20px]">favorite</span>
          {t('saveButton')}
        </button>
        <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
          <button
            type="button"
            onClick={() => router.push('/outfit/step-3')}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-low px-space-sm py-2.5 text-label-md text-on-surface transition-all hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">accessibility_new</span>
            {t('changePoseButton')}
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-low px-space-sm py-2.5 text-label-md text-on-surface transition-all hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">videocam</span>
            {t('rotateViewButton')}
          </button>
        </div>
        <div className="mt-space-xs flex items-center justify-between gap-space-sm rounded-xl bg-surface-container-high/40 p-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-lowest text-primary shadow-xs">
              <span className="material-symbols-outlined text-[20px]">smartphone</span>
            </div>
            <div>
              <span className="block text-label-md font-semibold text-on-surface">{t('mobileAppTitle')}</span>
              <span className="block text-body-sm text-on-surface-variant">{t('mobileAppDetail')}</span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full bg-on-surface px-3 py-1.5 text-label-sm text-surface transition-opacity hover:opacity-90"
          >
            {t('downloadAppButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
