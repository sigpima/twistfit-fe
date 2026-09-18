'use client'

import { useTranslations } from 'next-intl'
import AuthGate from '@/components/auth/AuthGate'
import { useAuth } from '@/components/auth/AuthProvider'
import ProfileHeader from '@/components/profile/ProfileHeader'
import PersonalInfoCard from '@/components/profile/PersonalInfoCard'
import ChangePasswordCard from '@/components/profile/ChangePasswordCard'
import ProfileQuickLinks from '@/components/profile/ProfileQuickLinks'

export default function ProfilePage() {
  const t = useTranslations('Profile')
  const { user } = useAuth()

  return (
    <main className="w-full bg-surface">
      <AuthGate>
        {user && (
          <section className="mx-auto w-full max-w-3xl space-y-6 px-6 py-space-xl lg:py-24">
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <ProfileHeader user={user} />
            <PersonalInfoCard user={user} />
            <ChangePasswordCard />
            <ProfileQuickLinks />
          </section>
        )}
      </AuthGate>
    </main>
  )
}
