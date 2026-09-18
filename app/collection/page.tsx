'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import AuthGate from '@/components/auth/AuthGate'
import OutfitResultsSection from '@/components/collection/OutfitResultsSection'
import SavedForumPostList from '@/components/forum/SavedForumPostList'

const TABS = ['posts', 'outfits'] as const

export default function CollectionPage() {
  const t = useTranslations('Collection')
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('posts')

  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-3xl space-y-6 px-6 py-space-xl lg:py-24">
          <div>
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">{t('subtitle')}</p>
          </div>
          <div className="flex gap-space-lg border-b border-outline-variant">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`-mb-px border-b-2 px-space-xs pb-space-sm text-label-lg font-semibold transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </div>
          {activeTab === 'posts' ? <SavedForumPostList /> : <OutfitResultsSection />}
        </section>
      </AuthGate>
    </main>
  )
}
