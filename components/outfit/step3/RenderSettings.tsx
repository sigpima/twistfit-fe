'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function RenderSettings() {
  const t = useTranslations('Outfit.Step3.RenderSettings')
  const [isHdOn, setIsHdOn] = useState(true)
  const [isPhysicsOn, setIsPhysicsOn] = useState(true)

  return (
    <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center gap-space-xs">
        <span className="material-symbols-outlined text-primary">auto_fix_high</span>
        <h3 className="text-title-md font-semibold text-on-surface">{t('heading')}</h3>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
            <span className="material-symbols-outlined text-[20px]">hd</span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-lg font-semibold text-on-surface">{t('hd4kLabel')}</span>
            <span className="text-body-sm text-on-surface-variant">{t('hd4kDetail')}</span>
          </div>
        </div>
        <input
          type="checkbox"
          checked={isHdOn}
          onChange={(event) => setIsHdOn(event.target.checked)}
          aria-label={t('hd4kLabel')}
        />
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
            <span className="material-symbols-outlined text-[20px]">waves</span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-lg font-semibold text-on-surface">{t('physicsLabel')}</span>
            <span className="text-body-sm text-on-surface-variant">{t('physicsDetail')}</span>
          </div>
        </div>
        <input
          type="checkbox"
          checked={isPhysicsOn}
          onChange={(event) => setIsPhysicsOn(event.target.checked)}
          aria-label={t('physicsLabel')}
        />
      </div>
    </div>
  )
}
