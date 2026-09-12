'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

const GARMENT_TYPES = [
  { value: 'top', key: 'top' },
  { value: 'bottom', key: 'bottom' },
  { value: 'dress', key: 'dress' },
  { value: 'outerwear', key: 'outerwear' },
] as const

const FIT_OPTIONS = [
  { value: 'slim', key: 'slim' },
  { value: 'regular', key: 'regular' },
  { value: 'loose', key: 'loose' },
  { value: 'oversize', key: 'oversize' },
] as const

const PALETTE_SWATCHES = [
  { hex: '#fbd7e4', key: 'blushPink' },
  { hex: '#d0e1fd', key: 'icyPastelBlue' },
  { hex: '#e6ddf5', key: 'softLilac' },
  { hex: '#ffffff', key: 'pureIvory' },
  { hex: '#4a5a80', key: 'navyContrast' },
] as const

export default function ColorHarmonyCard() {
  const t = useTranslations('Outfit.Step1.ColorHarmonyCard')
  const [garmentType, setGarmentType] = useState('top')
  const [fit, setFit] = useState('regular')

  return (
    <div className="relative flex flex-col gap-space-md overflow-hidden rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[22px] text-secondary">auto_fix_high</span>
          <h2 className="text-headline-sm font-semibold text-on-surface">{t('title')}</h2>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-label-sm font-bold tracking-wide text-on-secondary">
          {t('matchBadge')}
        </span>
      </div>
      <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-md">
        <div className="flex items-center justify-between">
          <span className="text-label-md font-medium text-on-surface-variant">{t('bestPaletteLabel')}</span>
          <span className="text-label-lg font-bold text-primary">{t('bestPaletteValue')}</span>
        </div>
        <div className="flex items-center gap-space-xs pt-1">
          {PALETTE_SWATCHES.map((swatch) => (
            <div
              key={swatch.hex}
              title={t(`swatches.${swatch.key}`)}
              className="h-7 w-7 rounded-full shadow-sm"
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
        <div className="mt-space-xs flex flex-col gap-1">
          <div className="flex justify-between text-label-sm text-on-surface-variant">
            <span>{t('undertoneMatchLabel')}</span>
            <span className="font-bold text-secondary">{t('undertoneMatchValue')}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-2 w-[98%] rounded-full bg-gradient-to-r from-primary to-secondary" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-space-sm">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="garment-type"
            className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant"
          >
            {t('garmentTypeLabel')}
          </label>
          <select
            id="garment-type"
            value={garmentType}
            onChange={(event) => setGarmentType(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl bg-surface-container-low px-space-sm py-2 text-label-md text-on-surface focus:outline-none"
          >
            {GARMENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`garmentTypes.${option.key}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="garment-fit"
            className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant"
          >
            {t('fitLabel')}
          </label>
          <select
            id="garment-fit"
            value={fit}
            onChange={(event) => setFit(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl bg-surface-container-low px-space-sm py-2 text-label-md text-on-surface focus:outline-none"
          >
            {FIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`fitOptions.${option.key}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
