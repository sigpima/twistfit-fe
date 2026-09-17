'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import AccessoryRecommendations from './AccessoryRecommendations'
import ResultPreview from './ResultPreview'

export default function Step3PageContent() {
  const t = useTranslations('Outfit.Step3.Page')
  const router = useRouter()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-space-lg px-margin-desktop py-space-xl lg:max-w-6xl">
      <h1 className="text-headline-lg text-on-surface">{t('heading')}</h1>
      <div className="grid w-full grid-cols-1 items-start gap-space-lg lg:grid-cols-12 lg:items-end lg:gap-8">
        <div className="w-full lg:col-span-7">
          <ResultPreview />
        </div>
        <AccessoryRecommendations />
      </div>
      <button
        type="button"
        onClick={() => router.push('/outfit/step-1')}
        className="flex items-center justify-center gap-space-sm rounded-full bg-primary px-space-xl py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg"
      >
        <span className="material-symbols-outlined text-[20px]">refresh</span>
        <span>{t('newOutfitButton')}</span>
      </button>
    </div>
  )
}
