'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function LogoMeaningSection() {
  const t = useTranslations('About.LogoMeaning')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="w-full px-margin-desktop py-space-lg">
      <div className="mx-auto max-w-3xl rounded-xl bg-surface-container-low p-space-lg shadow-sm">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="group flex w-full items-center justify-between gap-space-md text-left"
        >
          <h2 className="text-headline-sm font-semibold text-on-surface">{t('heading')}</h2>
          <span
            className={`material-symbols-outlined shrink-0 text-[24px] text-outline transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            keyboard_arrow_down
          </span>
        </button>
        <p
          className={`mt-space-sm text-body-md leading-relaxed text-on-surface-variant ${
            isOpen ? '' : 'line-clamp-1'
          }`}
        >
          {t('body')}
        </p>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="mt-space-xs text-label-md font-semibold text-primary hover:underline"
        >
          {isOpen ? t('collapseLabel') : t('expandLabel')}
        </button>
      </div>
    </section>
  )
}
