'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useOutfitFlow } from '../OutfitFlowProvider'

export default function ModelDossier() {
  const t = useTranslations('Outfit.Step2.ModelDossier')
  const { selectedModel } = useOutfitFlow()
  const [isHdOn, setIsHdOn] = useState(true)

  return (
    <div className="sticky top-24 flex flex-col gap-space-md rounded-3xl bg-surface-container-lowest p-space-md shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-headline-sm text-on-surface">{t('title')}</span>
        <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-label-sm font-semibold text-on-primary-fixed">
          {t('matchBadge')}
        </span>
      </div>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface-container shadow-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selectedModel.dossierImage} alt={selectedModel.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent p-space-md text-on-primary">
          <span className="text-headline-sm font-bold">
            {t('nameWithOfficialSuffix', { name: selectedModel.name })}
          </span>
          <span className="text-body-sm text-inverse-on-surface opacity-90">
            {t('poseTagline', { count: selectedModel.poseCount, tagline: selectedModel.tagline })}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-space-xs rounded-2xl bg-surface-container-low p-space-sm">
        <div className="flex flex-col rounded-xl bg-surface-container-lowest p-2">
          <span className="text-label-sm text-outline">{t('heightLabel')}</span>
          <span className="mt-0.5 text-label-lg font-bold text-on-surface">{selectedModel.height}</span>
          <span className="text-body-sm text-on-surface-variant">{t('heightRatioNote')}</span>
        </div>
        <div className="flex flex-col rounded-xl bg-surface-container-lowest p-2">
          <span className="text-label-sm text-outline">{t('bodyShapeLabel')}</span>
          <span className="mt-0.5 text-label-lg font-bold text-on-surface">{selectedModel.bodyShape}</span>
          <span className="text-body-sm text-on-surface-variant">{t('waistNote', { waist: selectedModel.waist })}</span>
        </div>
        <div className="flex flex-col rounded-xl bg-surface-container-lowest p-2">
          <span className="text-label-sm text-outline">{t('undertoneLabel')}</span>
          <span className="mt-0.5 text-label-lg font-bold capitalize text-primary">{selectedModel.undertone}</span>
        </div>
        <div className="flex flex-col rounded-xl bg-surface-container-lowest p-2">
          <span className="text-label-sm text-outline">{t('personalColorLabel')}</span>
          <span className="mt-0.5 text-label-lg font-bold text-secondary">{selectedModel.personalColor}</span>
        </div>
      </div>
      <div className="flex flex-col gap-space-sm pt-space-xs">
        <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[20px]">high_density</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-md font-semibold text-on-surface">{t('hdModeLabel')}</span>
              <span className="text-body-sm text-outline">{t('hdModeDetail')}</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isHdOn}
            onChange={(event) => setIsHdOn(event.target.checked)}
            aria-label={t('hdModeLabel')}
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-secondary-fixed/30 px-space-sm py-2 text-body-sm text-on-secondary-fixed">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
            {t('renderTimeLabel')}
          </span>
          <span className="text-label-md font-bold">{t('renderTimeValue')}</span>
        </div>
        <p className="text-center text-body-sm leading-tight text-outline">
          {t('autoAdjustNote', { name: selectedModel.name })}
        </p>
      </div>
    </div>
  )
}
