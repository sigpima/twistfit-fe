'use client'

import { useTranslations } from 'next-intl'

type CameraArPolicyModalProps = {
  isOpen: boolean
  onClose: () => void
}

type PolicySection = {
  heading: string
  intro?: string
  items: { label: string; text: string }[]
}

export default function CameraArPolicyModal({ isOpen, onClose }: CameraArPolicyModalProps) {
  const t = useTranslations('CameraArPolicyModal')

  if (!isOpen) return null

  const sections = t.raw('sections') as PolicySection[]

  return (
    <div
      data-testid="camera-ar-policy-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl bg-surface-container-lowest p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('closeAriaLabel')}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <h3 className="pr-10 text-headline-sm font-bold text-on-surface">{t('title')}</h3>

        <div className="mt-4 space-y-5 overflow-y-auto pr-1 text-body-md leading-relaxed text-on-surface-variant">
          <div>
            <p className="text-label-lg font-bold tracking-wide text-on-surface">{t('documentTitle')}</p>
            <p className="mt-1 text-body-sm italic text-on-surface-variant">{t('documentSubtitle')}</p>
          </div>

          <p>{t('intro')}</p>

          {sections.map((section) => (
            <div key={section.heading}>
              <h4 className="text-label-lg font-bold text-on-surface">{section.heading}</h4>
              {section.intro && <p className="mt-1">{section.intro}</p>}
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <span className="font-semibold text-on-surface">{item.label}:</span> {item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full shrink-0 rounded-full bg-primary px-space-lg py-space-sm text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-container"
        >
          {t('closeButton')}
        </button>
      </div>
    </div>
  )
}
