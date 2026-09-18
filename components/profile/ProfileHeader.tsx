'use client'

import { useTranslations } from 'next-intl'
import type { AuthUser } from '@/components/auth/AuthProvider'

export default function ProfileHeader({ user }: { user: AuthUser }) {
  const t = useTranslations('Profile.Header')
  const initial = user.name.trim().charAt(0).toUpperCase() || '?'
  const memberSince = new Date(user.createdAt).toLocaleDateString('vi-VN')

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-outline bg-surface-container-lowest p-6 shadow-[0_12px_36px_rgba(4,28,55,0.06)] sm:p-8">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-headline-md font-bold text-on-primary">
        {initial}
      </div>
      <div className="min-w-0">
        <p className="truncate text-headline-sm font-bold text-on-surface">{user.name}</p>
        {user.email && <p className="truncate text-body-sm text-on-surface-variant">{user.email}</p>}
        <p className="mt-1 text-label-sm text-outline">{t('memberSince', { date: memberSince })}</p>
      </div>
    </div>
  )
}
