'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useOutfitFlow } from '../OutfitFlowProvider'

const MEASURE_MIN = 41
const MEASURE_MAX = 149

type MeasureStepperProps = {
  label: string
  value: number
  onChange: (value: number) => void
  decreaseAriaLabel: string
  increaseAriaLabel: string
  unit: string
}

function MeasureStepper({ label, value, onChange, decreaseAriaLabel, increaseAriaLabel, unit }: MeasureStepperProps) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-surface-container-low p-space-sm text-center">
      <span className="text-label-sm text-outline">{label}</span>
      <div className="mt-1 flex w-full items-center justify-between">
        <button
          type="button"
          aria-label={decreaseAriaLabel}
          onClick={() => onChange(Math.max(MEASURE_MIN, value - 1))}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container text-label-md font-bold text-on-surface hover:bg-surface-container-highest"
        >
          -
        </button>
        <span className="text-headline-sm font-bold text-on-surface">{value}</span>
        <button
          type="button"
          aria-label={increaseAriaLabel}
          onClick={() => onChange(Math.min(MEASURE_MAX, value + 1))}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container text-label-md font-bold text-on-surface hover:bg-surface-container-highest"
        >
          +
        </button>
      </div>
      <span className="text-label-sm text-outline-variant">{unit}</span>
    </div>
  )
}

export default function BodyMeasurements() {
  const t = useTranslations('Outfit.Step3.BodyMeasurements')
  const { selectedModel } = useOutfitFlow()
  const [height, setHeight] = useState(165)
  const [weight, setWeight] = useState(50)
  const [bust, setBust] = useState(84)
  const [waist, setWaist] = useState(62)
  const [hip, setHip] = useState(90)

  const heightLabel = `1m${height - 100}`

  return (
    <div className="sticky top-24 flex flex-col gap-space-lg rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary">straighten</span>
          <h2 className="text-title-md font-semibold text-on-surface">{t('heading')}</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setHeight(165)
            setWeight(50)
            setBust(84)
            setWaist(62)
            setHip(90)
          }}
          className="text-label-sm font-semibold text-primary transition-colors hover:text-on-surface-variant"
        >
          {t('resetButton')}
        </button>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-container-high p-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
            <span className="material-symbols-outlined text-[22px]">hourglass_empty</span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-sm uppercase tracking-wider text-outline">{t('aiAnalysisLabel')}</span>
            <span className="text-headline-sm font-bold text-on-surface">{selectedModel.bodyShape}</span>
          </div>
        </div>
        <span className="rounded-full bg-surface-container-lowest px-2 py-1 text-label-sm font-bold text-secondary">
          {t('matchBadge')}
        </span>
      </div>
      <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant">{t('heightLabel')}</span>
            <span className="text-headline-sm font-bold text-primary">{heightLabel}</span>
          </div>
          <input
            type="range"
            min={145}
            max={185}
            value={height}
            aria-label={t('heightLabel')}
            onChange={(event) => setHeight(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
          />
          <div className="flex justify-between text-label-sm text-outline">
            <span>{t('heightMin')}</span>
            <span>{t('heightMid')}</span>
            <span>{t('heightMax')}</span>
          </div>
        </div>
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant">{t('weightLabel')}</span>
            <span className="text-headline-sm font-bold text-primary">{weight} kg</span>
          </div>
          <input
            type="range"
            min={40}
            max={80}
            value={weight}
            aria-label={t('weightLabel')}
            onChange={(event) => setWeight(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
          />
          <div className="flex justify-between text-label-sm text-outline">
            <span>{t('weightMin')}</span>
            <span>{t('weightMid')}</span>
            <span>{t('weightMax')}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-space-sm">
        <span className="text-label-md font-semibold uppercase tracking-wider text-on-surface">
          {t('measurementsHeading')}
        </span>
        <div className="grid grid-cols-3 gap-space-sm">
          <MeasureStepper
            label={t('bustLabel')}
            value={bust}
            onChange={setBust}
            decreaseAriaLabel={t('decreaseAriaLabel', { label: t('bustLabel') })}
            increaseAriaLabel={t('increaseAriaLabel', { label: t('bustLabel') })}
            unit={t('cmUnit')}
          />
          <MeasureStepper
            label={t('waistLabel')}
            value={waist}
            onChange={setWaist}
            decreaseAriaLabel={t('decreaseAriaLabel', { label: t('waistLabel') })}
            increaseAriaLabel={t('increaseAriaLabel', { label: t('waistLabel') })}
            unit={t('cmUnit')}
          />
          <MeasureStepper
            label={t('hipLabel')}
            value={hip}
            onChange={setHip}
            decreaseAriaLabel={t('decreaseAriaLabel', { label: t('hipLabel') })}
            increaseAriaLabel={t('increaseAriaLabel', { label: t('hipLabel') })}
            unit={t('cmUnit')}
          />
        </div>
      </div>
      <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center justify-between text-label-md">
          <span className="font-medium text-on-surface">{t('peplumFitLabel')}</span>
          <span className="font-bold text-primary">{t('peplumFitValue')}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-primary to-secondary" />
        </div>
        <span className="text-body-sm text-on-surface-variant">
          {t('peplumFitNote', { waist, bodyShape: selectedModel.bodyShape.toLowerCase() })}
        </span>
      </div>
    </div>
  )
}
