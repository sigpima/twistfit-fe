'use client'

import { useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { FORM_INPUT_CLASS } from '@/lib/formFieldStyles'

const inputClass = `${FORM_INPUT_CLASS} pr-12`

function PasswordField({
  id,
  label,
  value,
  onChange,
  showLabel,
  hideLabel,
  minLength,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  showLabel: string
  hideLabel: string
  minLength?: number
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label-md font-semibold text-on-surface">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={minLength}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? hideLabel : showLabel}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {visible ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  )
}

export default function ChangePasswordCard() {
  const t = useTranslations('Profile.ChangePassword')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccess(false)
    setError('')

    if (newPassword !== confirmPassword) {
      setError(t('mismatchError'))
      return
    }

    setSubmitting(true)
    const response = await apiFetch('/auth/me/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    setSubmitting(false)

    if (!response.ok) {
      if (response.status === 401) setError(t('incorrectCurrentError'))
      else setError(t('genericError'))
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSuccess(true)
  }

  return (
    <div className="rounded-3xl border border-outline bg-surface-container-lowest p-6 shadow-[0_12px_36px_rgba(4,28,55,0.06)] sm:p-8">
      <h2 className="mb-6 text-headline-sm font-bold text-on-surface">{t('heading')}</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <PasswordField
          id="profile-current-password"
          label={t('fields.currentPassword')}
          value={currentPassword}
          onChange={setCurrentPassword}
          showLabel={t('showPassword')}
          hideLabel={t('hidePassword')}
        />
        <PasswordField
          id="profile-new-password"
          label={t('fields.newPassword')}
          value={newPassword}
          onChange={setNewPassword}
          showLabel={t('showPassword')}
          hideLabel={t('hidePassword')}
          minLength={8}
        />
        <PasswordField
          id="profile-confirm-password"
          label={t('fields.confirmPassword')}
          value={confirmPassword}
          onChange={setConfirmPassword}
          showLabel={t('showPassword')}
          hideLabel={t('hidePassword')}
          minLength={8}
        />
        <div className="flex flex-col items-start gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {success && <span className="text-label-sm text-primary">{t('successMessage')}</span>}
            {error && <span className="text-label-sm text-error">{error}</span>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60 sm:w-auto"
          >
            {submitting ? t('saving') : t('saveButton')}
          </button>
        </div>
      </form>
    </div>
  )
}
