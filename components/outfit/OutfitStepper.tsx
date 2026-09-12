'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

const STEPS = [
  { step: 1, key: 'chooseGarment', href: '/outfit/step-1' },
  { step: 2, key: 'modelAndFace', href: '/outfit/step-2' },
  { step: 3, key: 'poseAndAngle', href: '/outfit/step-3' },
  { step: 4, key: 'viewResult', href: '/outfit/step-4' },
] as const

export default function OutfitStepper({
  currentStep,
  maxStepReached = currentStep,
}: {
  currentStep: 1 | 2 | 3 | 4
  maxStepReached?: 1 | 2 | 3 | 4
}) {
  const t = useTranslations('Outfit.Stepper')

  return (
    <section className="sticky top-20 z-40 w-full bg-surface-container-low/80 px-margin-desktop py-space-lg shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs text-on-surface-variant">
            <span className="text-label-sm font-bold uppercase tracking-widest text-primary">{t('kicker')}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-label-sm font-medium">{t('kickerSuffix')}</span>
          </div>
          <div className="flex items-center gap-space-xs rounded-full bg-secondary-container/60 px-space-sm py-0.5 text-label-sm text-on-secondary-container">
            <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
            <span>{t('badge')}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-space-md pt-space-xs md:grid-cols-4">
          {STEPS.map((item) => {
            const isCurrent = item.step === currentStep
            const isVisited = item.step <= maxStepReached
            const isReachable = isVisited && !isCurrent
            const content = (
              <>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-headline-sm font-bold ${
                    isCurrent
                      ? 'bg-primary text-on-primary shadow-[0_0_0_4px_rgba(219,225,255,0.7)]'
                      : isReachable
                        ? 'bg-primary-fixed text-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {isReachable ? (
                    <span className="material-symbols-outlined text-[20px]">check</span>
                  ) : (
                    item.step
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span
                    className={`text-label-md font-bold uppercase tracking-tight ${
                      isCurrent ? 'text-primary' : 'text-outline'
                    }`}
                  >
                    {isCurrent
                      ? t('statusCurrent', { step: item.step })
                      : isReachable
                        ? t('statusDone', { step: item.step })
                        : t('statusUpcoming', { step: item.step })}
                  </span>
                  <span
                    className={`truncate text-title-md font-semibold ${
                      isCurrent ? 'text-on-surface' : 'text-on-surface-variant'
                    }`}
                  >
                    {t(`steps.${item.key}`)}
                  </span>
                </div>
              </>
            )

            const className = `flex items-center gap-space-sm rounded-xl p-space-sm transition-all ${
              isCurrent
                ? 'bg-surface-container-lowest shadow-md'
                : isReachable
                  ? 'bg-surface-container-lowest/60 hover:bg-surface-container-lowest'
                  : 'bg-surface-container/60 opacity-70'
            }`

            if (isReachable) {
              return (
                <Link key={item.step} href={item.href} className={className}>
                  {content}
                </Link>
              )
            }

            return (
              <div key={item.step} className={className}>
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
