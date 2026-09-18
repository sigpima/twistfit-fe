'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import PhoneMockupStepper from './PhoneMockupStepper'
import { FEATURE_STEP_IMAGES, type FeatureKey } from '@/lib/featureShowcaseSteps'

type FeatureSectionProps = {
  featureKey: FeatureKey
  accentClassName: string
  cta: { label: string; onClick?: () => void; href?: string }
}

export default function FeatureSection({ featureKey, accentClassName, cta }: FeatureSectionProps) {
  const t = useTranslations(`Home.FeatureShowcase.features.${featureKey}`)
  const [activeStep, setActiveStep] = useState(0)
  const images = FEATURE_STEP_IMAGES[featureKey]

  const stepperImages = images.map((image, index) => ({
    key: image.key,
    src: image.src,
    bg: image.bg,
    alt: t(`steps.${image.key}.title`) || `Step ${index + 1}`,
  }))

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <PhoneMockupStepper images={stepperImages} activeIndex={activeStep} onSelect={setActiveStep} />
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-7">
        <h3 className={`text-headline-lg font-bold ${accentClassName}`}>{t('title')}</h3>

        <div className="space-y-2 lg:hidden">
          <h4 className="text-title-md font-bold text-on-surface">{t(`steps.${images[activeStep].key}.title`)}</h4>
          <p className="text-body-md text-on-surface-variant">{t(`steps.${images[activeStep].key}.body`)}</p>
        </div>

        <div className="hidden space-y-4 lg:block">
          {images.map((image, index) => (
            <button
              key={image.key}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-surface-container-lowest ${
                index === activeStep ? 'bg-surface-container-lowest' : ''
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface-container-high text-headline-sm font-bold text-on-surface-variant">
                {index + 1}
              </span>
              <span>
                <span className="block text-title-md font-bold text-on-surface">{t(`steps.${image.key}.title`)}</span>
                <span className="mt-1 block text-body-md text-on-surface-variant">{t(`steps.${image.key}.body`)}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="pt-2">
          {cta.href ? (
            <Link
              href={cta.href}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              <span>{cta.label}</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={cta.onClick}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              <span>{cta.label}</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
