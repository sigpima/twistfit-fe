'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

export default function AuthGate({ children }: { children: ReactNode }) {
  const t = useTranslations('Auth')
  const router = useRouter()
  const { user, isHydrated } = useAuth()

  useEffect(() => {
    if (!isHydrated) return
    if (!user) {
      router.push('/login')
    }
  }, [isHydrated, user, router])

  if (!isHydrated || !user) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <p className="text-body-md text-on-surface-variant">{t('checkingAccess')}</p>
      </div>
    )
  }

  return <>{children}</>
}
