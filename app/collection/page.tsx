'use client'

import { useTranslations } from 'next-intl'
import AuthGate from '@/components/auth/AuthGate'
import OutfitResultsSection from '@/components/collection/OutfitResultsSection'
import WardrobeSection from '@/components/collection/WardrobeSection'
import PersonalColorSection from '@/components/collection/PersonalColorSection'

export default function CollectionPage() {
  const t = useTranslations('Collection')

  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-6xl space-y-6 px-6 py-space-xl lg:py-24">
          <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
          <OutfitResultsSection />
          <WardrobeSection />
          <PersonalColorSection />
        </section>
      </AuthGate>
    </main>
  )
}
