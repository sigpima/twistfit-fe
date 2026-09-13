'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { apiFetch } from '@/lib/apiClient'

export default function RegisterForm() {
  const t = useTranslations('Register')
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [confirmError, setConfirmError] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

    if (password !== confirmPassword) {
      setConfirmError(true)
      setFormError(null)
      ;(form.elements.namedItem('confirmPassword') as HTMLInputElement).focus()
      return
    }
    setConfirmError(false)

    const response = await apiFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setFormError(data.error === 'EMAIL_TAKEN' ? t('errors.emailTaken') : t('errors.generic'))
      return
    }

    setFormError(null)
    const account = await login(email, password)
    if (account) {
      router.push(account.role === 'admin' ? '/admin' : '/')
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl items-center justify-center px-6 py-space-xl lg:py-24">
      <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-8 shadow-[0_12px_36px_rgba(4,28,55,0.08)] lg:p-10">
        <div className="mb-6 text-center">
          <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">{t('subtitle')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="register-name" className="text-label-md font-semibold text-on-surface">
              {t('fields.name.label')}
            </label>
            <input
              id="register-name"
              name="name"
              type="text"
              required
              placeholder={t('fields.name.placeholder')}
              className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-email" className="text-label-md font-semibold text-on-surface">
              {t('fields.email.label')}
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              required
              placeholder={t('fields.email.placeholder')}
              className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-password" className="text-label-md font-semibold text-on-surface">
              {t('fields.password.label')}
            </label>
            <div className="relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder={t('fields.password.placeholder')}
                className="w-full rounded-xl bg-surface px-4 py-3 pr-12 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-confirm-password" className="text-label-md font-semibold text-on-surface">
              {t('fields.confirmPassword.label')}
            </label>
            <div className="relative">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder={t('fields.confirmPassword.placeholder')}
                aria-invalid={confirmError}
                aria-describedby={confirmError ? 'register-confirm-password-error' : undefined}
                onChange={() => setConfirmError(false)}
                className="w-full rounded-xl bg-surface px-4 py-3 pr-12 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {confirmError && (
              <p id="register-confirm-password-error" className="text-label-sm text-error">
                {t('errors.passwordMismatch')}
              </p>
            )}
          </div>

          {formError && (
            <p className="rounded-xl bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
          >
            {t('submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-body-sm text-on-surface-variant">
          {t('haveAccount')}{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </section>
  )
}
