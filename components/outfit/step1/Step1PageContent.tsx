'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import UploadFlow from '@/components/outfit/step1/UploadFlow'
import WardrobeLibrary from '@/components/outfit/step1/WardrobeLibrary'

const TABS = [
  { id: 'closet', icon: 'checkroom', key: 'closet' },
  { id: 'upload', icon: 'cloud_upload', key: 'upload' },
] as const

export default function Step1PageContent() {
  const t = useTranslations('Outfit.Step1.Page')
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('closet')

  function handleContinue() {
    router.push('/outfit/step-2')
  }

  return (
    <div className="flex w-full flex-col pb-space-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-lg px-margin-desktop pt-space-md">
        <div className="flex flex-col justify-between gap-space-md pt-space-lg pb-space-xs md:flex-row md:items-end">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-label-sm font-semibold uppercase tracking-widest text-on-primary">
                {t('stepBadge')}
              </span>
              <span className="text-label-md font-semibold italic text-secondary">{t('tagline')}</span>
            </div>
            <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">{t('heading')}</h1>
            <p className="max-w-2xl text-body-md text-on-surface-variant">{t('subheading')}</p>
          </div>
          <div className="inline-flex shrink-0 self-start rounded-2xl bg-surface-container-high p-1 shadow-inner md:self-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-space-xs rounded-xl px-space-md py-space-sm text-label-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-surface-container-lowest font-semibold text-on-surface shadow-sm'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.id === 'closet' ? t('modeTabs.closet') : t('modeTabs.upload')}</span>
              </button>
            ))}
          </div>
        </div>
        {activeTab === 'closet' ? (
          <WardrobeLibrary />
        ) : (
          <UploadFlow onUploaded={() => setActiveTab('closet')} />
        )}
        <div className="mt-space-md flex flex-col items-center justify-between gap-space-md pt-space-lg sm:flex-row">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-space-xs rounded-2xl bg-surface-container-low px-space-lg py-space-md font-semibold text-label-lg text-on-surface transition-all hover:bg-surface-container sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{t('backHome')}</span>
          </Link>
          <div className="flex w-full items-center gap-space-md sm:w-auto">
            <span className="hidden text-body-sm text-outline md:inline">{t('autoSavedNote')}</span>
            <button
              type="button"
              onClick={handleContinue}
              className="flex w-full items-center justify-center gap-space-sm rounded-2xl bg-primary px-space-xl py-space-md font-bold text-headline-sm text-on-primary shadow-lg shadow-primary/25 transition-all hover:bg-primary-container hover:shadow-xl sm:w-auto"
            >
              <span>{t('continueButton')}</span>
              <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
