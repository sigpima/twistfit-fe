'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SelectedGarmentBanner from './SelectedGarmentBanner'
import ModelCatalog from './ModelCatalog'
import ModelDossier from './ModelDossier'
import type { CatalogModel } from '@/lib/modelCatalog'

const MODE_TABS = [
  { id: 'our-models', icon: 'group', key: 'ourModels' },
  { id: 'user-model', icon: 'add_a_photo', key: 'userModel' },
] as const

export default function Step2PageContent({ models }: { models: CatalogModel[] }) {
  const t = useTranslations('Outfit.Step2.Page')
  const router = useRouter()
  const [activeMode, setActiveMode] = useState<(typeof MODE_TABS)[number]['id']>('our-models')

  function handleContinue() {
    router.push('/outfit/step-3')
  }

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-surface-container-low px-margin-desktop py-space-lg">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-space-md lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-space-xs text-label-md font-semibold uppercase tracking-wider text-secondary">
              <span className="material-symbols-outlined text-[18px]">face_retouching_natural</span>
              {t('eyebrow')}
            </div>
            <h1 className="mt-1 text-headline-lg tracking-tight text-on-surface">{t('heading')}</h1>
            <p className="mt-1 text-body-md text-on-surface-variant">{t('subheading')}</p>
          </div>
          <SelectedGarmentBanner />
        </div>
      </section>
      <section className="w-full bg-background px-margin-desktop py-space-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-gutter-desktop lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-8">
            <div className="flex items-center gap-space-xs rounded-2xl bg-surface-container p-1.5">
              {MODE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-space-xs rounded-xl px-space-sm py-3 text-label-md transition-all sm:flex-row sm:gap-space-sm sm:px-space-md sm:text-title-md ${
                    activeMode === tab.id
                      ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                      : 'font-medium text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                  <span className="text-center">{t(`modeTabs.${tab.key}.label`)}</span>
                  <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-label-sm text-on-primary-fixed">
                    {t(`modeTabs.${tab.key}.badge`)}
                  </span>
                </button>
              ))}
            </div>
            <ModelCatalog models={models} />
          </div>
          <div className="lg:col-span-4">
            <ModelDossier />
          </div>
        </div>
      </section>
      <section className="sticky bottom-0 z-40 w-full bg-surface-container-lowest/95 px-margin-desktop py-space-md shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-space-md sm:flex-row">
          <Link
            href="/outfit/step-1"
            className="flex w-full items-center justify-center gap-space-xs rounded-full bg-surface-container-high px-space-lg py-3 text-label-lg text-on-surface transition-colors hover:bg-surface-container-highest sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('backButton')}
          </Link>
          <button
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-space-sm rounded-full bg-primary px-space-xl py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg sm:w-auto"
          >
            <span>{t('continueButton')}</span>
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </section>
    </div>
  )
}
