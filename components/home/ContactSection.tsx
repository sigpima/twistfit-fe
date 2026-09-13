'use client'

import { useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'

export default function ContactSection() {
  const t = useTranslations('Home.ContactSection')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const body = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      subject: (form.elements.namedItem('subject') as HTMLSelectElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }

    const response = await apiFetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      setSubmitted(false)
      setError(true)
      return
    }

    setError(false)
    setSubmitted(true)
    form.reset()
  }

  return (
    <section className="relative mt-12 w-full overflow-hidden bg-surface-container-low/80 py-space-xl">
      <div className="relative z-10 mx-auto max-w-7xl px-margin-desktop">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="flex flex-col space-y-6 lg:col-span-5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/contact-logo.png" alt={t('logoAlt')} className="h-12 w-12 object-contain" />
              <div>
                <span className="block text-headline-sm font-bold leading-none text-primary">TwistFit</span>
                <span className="text-body-sm text-on-surface-variant">{t('brandTagline')}</span>
              </div>
            </div>
            <h3 className="text-headline-md text-on-surface">{t('heading')}</h3>
            <p className="text-body-md text-on-surface-variant">{t('description')}</p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <span className="text-body-md">{t('email')}</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <span className="text-body-md">{t('phone')}</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <span className="text-body-md">{t('address')}</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_12px_36px_rgba(4,28,55,0.06)] lg:p-10">
              <div className="mb-6">
                <h4 className="text-headline-sm font-bold text-on-surface">{t('formHeading')}</h4>
                <p className="mt-1 text-body-sm text-on-surface-variant">{t('formSubheading')}</p>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-label-md font-semibold text-on-surface">
                      {t('labels.name')}
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      placeholder={t('placeholders.name')}
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-label-md font-semibold text-on-surface">
                      {t('labels.email')}
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      placeholder={t('placeholders.email')}
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="text-label-md font-semibold text-on-surface">
                      {t('labels.phone')}
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      placeholder={t('placeholders.phone')}
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-subject" className="text-label-md font-semibold text-on-surface">
                      {t('labels.subject')}
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      required
                      defaultValue=""
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface transition-colors focus:bg-surface-container-high focus:outline-none"
                    >
                      <option value="" disabled>
                        {t('subjectOptions.placeholder')}
                      </option>
                      <option value="color-test">{t('subjectOptions.colorTest')}</option>
                      <option value="virtual-fitting">{t('subjectOptions.virtualFitting')}</option>
                      <option value="stylist">{t('subjectOptions.stylist')}</option>
                      <option value="other">{t('subjectOptions.other')}</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-label-md font-semibold text-on-surface">
                    {t('labels.message')}
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    placeholder={t('placeholders.message')}
                    className="w-full resize-none rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  {submitted && <span className="text-label-sm text-primary">{t('successMessage')}</span>}
                  {error && <span className="text-label-sm text-error">{t('errorMessage')}</span>}
                  {!submitted && !error && <span />}
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container sm:w-auto"
                  >
                    <span>{t('submitButton')}</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
