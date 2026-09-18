'use client'

import { useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAuth, type AuthUser } from '@/components/auth/AuthProvider'
import { FORM_INPUT_CLASS } from '@/lib/formFieldStyles'

const inputClass = `${FORM_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-60`

const GENDER_OPTIONS = ['male', 'female', 'other'] as const

export default function PersonalInfoCard({ user }: { user: AuthUser }) {
  const t = useTranslations('Profile.PersonalInfo')
  const tRole = useTranslations('Profile')
  const { updateUser } = useAuth()

  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [birthDate, setBirthDate] = useState(user.birthDate ?? '')
  const [gender, setGender] = useState(user.gender ?? '')
  const [heightCm, setHeightCm] = useState(user.heightCm?.toString() ?? '')
  const [weightKg, setWeightKg] = useState(user.weightKg?.toString() ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setSuccess(false)
    setError('')

    const response = await apiFetch('/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone: phone || null,
        username: username || null,
        birthDate: birthDate || null,
        gender: gender || null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
      }),
    })

    setSubmitting(false)

    if (!response.ok) {
      if (response.status === 409) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null
        setError(body?.detail === 'USERNAME_TAKEN' ? t('usernameTakenError') : t('phoneTakenError'))
      } else if (response.status === 422) {
        setError(t('invalidPhoneError'))
      } else {
        setError(t('genericError'))
      }
      return
    }

    const account = (await response.json()) as AuthUser
    updateUser(account)
    setSuccess(true)
  }

  return (
    <div className="rounded-3xl border border-outline bg-surface-container-lowest p-6 shadow-[0_12px_36px_rgba(4,28,55,0.06)] sm:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-headline-sm font-bold text-on-surface">{t('heading')}</h2>
        {user.role === 'admin' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-label-sm font-semibold text-on-primary">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              admin_panel_settings
            </span>
            {tRole('adminBadge')}
          </span>
        )}
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="profile-name" className="text-label-md font-semibold text-on-surface">
              {t('fields.name')}
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-username" className="text-label-md font-semibold text-on-surface">
              {t('fields.username')}
            </label>
            <input
              id="profile-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={t('notUpdatedPlaceholder')}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-phone" className="text-label-md font-semibold text-on-surface">
              {t('fields.phone')}
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t('phonePlaceholder')}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-birth-date" className="text-label-md font-semibold text-on-surface">
              {t('fields.birthDate')}
            </label>
            <input
              id="profile-birth-date"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-gender" className="text-label-md font-semibold text-on-surface">
              {t('fields.gender')}
            </label>
            <select
              id="profile-gender"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className={inputClass}
            >
              <option value="">{t('notUpdatedPlaceholder')}</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`genderOptions.${option}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-height" className="text-label-md font-semibold text-on-surface">
              {t('fields.heightCm')}
            </label>
            <input
              id="profile-height"
              type="number"
              min="0"
              step="0.1"
              value={heightCm}
              onChange={(event) => setHeightCm(event.target.value)}
              placeholder={t('notUpdatedPlaceholder')}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="profile-weight" className="text-label-md font-semibold text-on-surface">
              {t('fields.weightKg')}
            </label>
            <input
              id="profile-weight"
              type="number"
              min="0"
              step="0.1"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
              placeholder={t('notUpdatedPlaceholder')}
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="profile-email" className="text-label-md font-semibold text-on-surface">
            {t('fields.email')}
          </label>
          <input id="profile-email" value={user.email ?? ''} disabled className={inputClass} />
          <p className="text-label-sm text-on-surface-variant">{t('emailLockedNote')}</p>
        </div>
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
