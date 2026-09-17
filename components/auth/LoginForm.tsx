'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { FORM_INPUT_CLASS } from '@/lib/formFieldStyles'

export default function LoginForm() {
  const t = useTranslations('Login')
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const identifier = (form.elements.namedItem('identifier') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const account = await login(identifier, password)
    if (!account) {
      setError(true)
      return
    }

    setError(false)
    router.push(account.role === 'admin' ? '/admin' : '/')
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
            <label htmlFor="login-identifier" className="text-label-md font-semibold text-on-surface">
              {t('fields.identifier.label')}
            </label>
            <input
              id="login-identifier"
              name="identifier"
              type="text"
              required
              placeholder={t('fields.identifier.placeholder')}
              className={FORM_INPUT_CLASS}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-label-md font-semibold text-on-surface">
              {t('fields.password.label')}
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder={t('fields.password.placeholder')}
                className={`${FORM_INPUT_CLASS} pr-12`}
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

          {error && (
            <p className="rounded-xl bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {t('errors.invalidCredentials')}
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
          {t('noAccount')}{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t('registerLink')}
          </Link>
        </p>
      </div>
    </section>
  )
}
