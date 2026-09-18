'use client'

import { useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'

export default function FaqSupportBanner() {
  const t = useTranslations('Faq.SupportBanner')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <section className="w-full px-margin-desktop pb-space-xl">
      <div className="relative mx-auto flex max-w-4xl flex-col overflow-hidden rounded-xl bg-gradient-to-r from-primary-fixed to-surface-container-high p-space-lg shadow-md md:p-space-xl">
        <div className="relative z-10 flex flex-col items-start justify-between gap-space-lg md:flex-row">
          <div className="flex-1">
            <div className="mb-space-xs inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest/80 px-space-sm py-space-xs">
              <span className="material-symbols-outlined text-[16px] text-secondary">support_agent</span>
              <span className="text-label-sm font-semibold uppercase tracking-wider text-secondary">
                {t('badge')}
              </span>
            </div>
            <h3 className="text-headline-md font-bold text-on-surface">{t('heading')}</h3>
            <p className="mt-space-xs max-w-lg text-body-md leading-relaxed text-on-surface-variant">
              {t('body')}
            </p>
          </div>
          {!isFormOpen && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="flex shrink-0 items-center justify-center gap-space-xs rounded-full bg-primary px-space-lg py-space-sm text-center text-label-lg text-on-primary shadow-sm transition-all duration-300 hover:bg-primary-container"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>{t('contactButton')}</span>
            </button>
          )}
        </div>

        {isFormOpen && !submitted && (
          <form
            onSubmit={handleSubmit}
            className="relative z-10 mt-space-lg grid grid-cols-1 gap-space-md rounded-lg bg-surface-container-lowest/90 p-space-lg sm:grid-cols-2"
          >
            <input
              type="text"
              required
              placeholder={t('namePlaceholder')}
              className="rounded-lg border border-outline-variant bg-surface px-space-md py-space-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="tel"
              required
              placeholder={t('phonePlaceholder')}
              className="rounded-lg border border-outline-variant bg-surface px-space-md py-space-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="email"
              required
              placeholder={t('emailPlaceholder')}
              className="rounded-lg border border-outline-variant bg-surface px-space-md py-space-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 sm:col-span-2"
            />
            <textarea
              required
              rows={3}
              placeholder={t('questionPlaceholder')}
              className="rounded-lg border border-outline-variant bg-surface px-space-md py-space-sm text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 sm:col-span-2"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-space-xs rounded-full bg-primary px-space-lg py-space-sm text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container sm:col-span-2"
            >
              {t('submitButton')}
            </button>
          </form>
        )}

        {submitted && (
          <p className="relative z-10 mt-space-lg text-label-md font-semibold text-primary">
            {t('successMessage')}
          </p>
        )}
      </div>
    </section>
  )
}
