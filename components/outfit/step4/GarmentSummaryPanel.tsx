'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useOutfitFlow } from '../OutfitFlowProvider'

export default function GarmentSummaryPanel() {
  const t = useTranslations('Outfit.Step4.GarmentSummaryPanel')
  const router = useRouter()
  const { selectedGarment } = useOutfitFlow()

  return (
    <div className="flex flex-col gap-space-md">
      <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="mb-space-sm flex items-center justify-between">
          <span className="text-label-lg font-semibold text-on-surface">{t('title')}</span>
          <span className="text-label-sm font-bold text-primary">{t('inStockBadge')}</span>
        </div>
        <div className="mb-space-sm flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-highest">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedGarment.thumbnail} alt={selectedGarment.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-label-md font-semibold text-on-surface">
              {selectedGarment.name}
            </span>
            <span className="block text-body-sm text-on-surface-variant">{t('materialNote')}</span>
            <span className="text-label-md font-bold text-secondary">{t('price')}</span>
          </div>
          <button
            type="button"
            className="rounded-lg bg-primary-fixed px-3 py-1.5 text-label-sm text-on-primary-fixed transition-colors hover:bg-primary hover:text-on-primary"
          >
            {t('buyButton')}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-surface-container-low p-2">
            <span className="block text-label-sm text-outline">{t('formLabel')}</span>
            <span className="text-label-md font-semibold text-on-surface">{t('formValue')}</span>
          </div>
          <div className="rounded-lg bg-surface-container-low p-2">
            <span className="block text-label-sm text-outline">{t('seasonLabel')}</span>
            <span className="text-label-md font-semibold text-on-surface">{t('seasonValue')}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-tertiary-fixed to-surface-container-high p-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[24px] text-tertiary">checkroom</span>
          <div>
            <span className="block text-label-md font-semibold text-on-tertiary-fixed">{t('tryMoreTitle')}</span>
            <span className="block text-body-sm text-on-tertiary-fixed-variant">{t('tryMoreDetail')}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/outfit/step-1')}
          className="shrink-0 rounded-full bg-inverse-surface px-space-md py-2 text-label-md text-inverse-on-surface shadow-sm transition-opacity hover:opacity-90"
        >
          {t('tryNewButton')}
        </button>
      </div>
    </div>
  )
}
