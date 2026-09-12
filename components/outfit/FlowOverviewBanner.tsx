'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

type FlowOverviewBannerProps = {
  title: string
  subtitle: string
  image: string
  imageAlt: string
}

export default function FlowOverviewBanner({ title, subtitle, image, imageAlt }: FlowOverviewBannerProps) {
  const t = useTranslations('Outfit.FlowOverviewBanner')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-container-high shadow-inner">
      <div className="flex flex-col items-start justify-between gap-space-sm bg-gradient-to-r from-primary-fixed/50 via-secondary-fixed/30 to-surface-container-high p-space-md md:flex-row md:items-center">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[24px] text-primary">palette</span>
          <div>
            <p className="text-label-lg font-bold text-on-primary-fixed">{title}</p>
            <p className="text-body-sm text-on-primary-fixed-variant">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-md py-1.5 text-label-sm font-label-sm text-primary shadow-sm transition-all hover:bg-primary hover:text-on-primary"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isOpen ? 'visibility_off' : 'visibility'}
          </span>
          <span>{isOpen ? t('hideButton') : t('showButton')}</span>
        </button>
      </div>
      {isOpen && (
        <div className="w-full bg-surface-container-lowest p-space-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={imageAlt} className="h-auto w-full rounded-xl object-cover shadow-sm" />
        </div>
      )}
    </div>
  )
}
