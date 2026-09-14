'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

type LoginRequiredModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  const t = useTranslations('LoginRequiredModal')

  if (!isOpen) return null

  return (
    <div
      data-testid="login-required-modal-backdrop"
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
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h3 className="text-headline-sm font-bold text-on-surface">{t('title')}</h3>
          <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">{t('description')}</p>
          <Link
            href="/login"
            onClick={onClose}
            className="mt-6 flex items-center gap-2 rounded-full bg-primary px-space-lg py-space-sm text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            {t('loginButton')}
          </Link>
        </div>
      </div>
    </div>
  )
}
