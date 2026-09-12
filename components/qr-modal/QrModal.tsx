'use client'

import { useTranslations } from 'next-intl'

type QrModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function QrModal({ isOpen, onClose }: QrModalProps) {
  const t = useTranslations('QrModal')

  if (!isOpen) return null

  return (
    <div
      data-testid="qr-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-surface-container-lowest p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('closeAriaLabel')}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-secondary">
            <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
          </div>
          <h3 className="text-headline-sm font-bold text-on-surface">{t('title')}</h3>
          <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">{t('description')}</p>
          <div className="relative mt-6 flex flex-col items-center rounded-2xl bg-surface-container-low p-4 shadow-inner">
            <svg className="h-48 w-48 text-on-surface" fill="currentColor" viewBox="0 0 100 100">
              <rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="5" y="5" />
              <rect fill="currentColor" height="14" rx="2" width="14" x="11" y="11" />
              <rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="69" y="5" />
              <rect fill="currentColor" height="14" rx="2" width="14" x="75" y="11" />
              <rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="5" y="69" />
              <rect fill="currentColor" height="14" rx="2" width="14" x="11" y="75" />
              <rect height="4" rx="1" width="4" x="36" y="9" />
              <rect height="4" rx="1" width="4" x="44" y="9" />
              <rect height="4" rx="1" width="4" x="52" y="9" />
              <rect height="4" rx="1" width="4" x="60" y="9" />
              <rect height="4" rx="1" width="4" x="9" y="36" />
              <rect height="4" rx="1" width="4" x="9" y="44" />
              <rect height="4" rx="1" width="4" x="9" y="52" />
              <rect height="4" rx="1" width="4" x="9" y="60" />
              <rect fill="#4c5a88" height="8" rx="2" width="8" x="38" y="38" />
              <rect fill="#7b516d" height="8" rx="2" width="8" x="48" y="48" />
              <rect height="6" rx="1" width="6" x="38" y="58" />
              <rect height="6" rx="1" width="6" x="56" y="38" />
              <rect height="4" rx="1" width="8" x="68" y="46" />
              <rect height="6" rx="1" width="8" x="46" y="68" />
              <rect height="12" rx="2" width="12" x="76" y="68" />
              <rect height="10" rx="1" width="6" x="58" y="78" />
              <rect height="6" rx="1" width="10" x="68" y="86" />
              <rect height="6" rx="1" width="6" x="36" y="80" />
            </svg>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest p-1 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/qr-logo.png" alt="TwistFit Logo" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 text-label-md font-bold text-primary">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              {t('compatibility')}
            </span>
            <p className="text-body-sm text-on-surface-variant">{t('instructions')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
