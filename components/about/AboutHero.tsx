'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

function useCountUpThousands(start: number, target: number, stepMs: number) {
  const [count, setCount] = useState(start)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((current) => {
        if (current >= target) {
          clearInterval(interval)
          return current
        }
        return current + 1
      })
    }, stepMs)
    return () => clearInterval(interval)
  }, [target, stepMs])

  return `${count}.000+`
}

export default function AboutHero() {
  const t = useTranslations('About.Hero')
  const analysisCount = useCountUpThousands(100, 120, 40)

  return (
    <section className="relative w-full px-margin-desktop py-space-xl lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <div className="mb-space-lg inline-flex items-center gap-space-xs rounded-full bg-surface-container-low px-space-md py-space-xs shadow-sm backdrop-blur-md">
          <span className="h-2 w-2 animate-ping rounded-full bg-secondary" />
          <span className="text-label-sm font-semibold uppercase tracking-widest text-primary">
            {t('badgeText')}
          </span>
        </div>
        <h1 className="max-w-4xl text-display-lg leading-tight tracking-tight text-on-surface">
          {t.rich('heading', {
            br: () => <br className="hidden sm:inline" />,
            highlight: (chunks) => (
              <span className="bg-gradient-to-r from-primary via-primary-container to-secondary bg-clip-text text-transparent">
                {chunks}
              </span>
            ),
          })}
        </h1>
        <p className="mt-space-lg max-w-3xl text-body-lg leading-relaxed text-on-surface-variant">
          {t.rich('subheading', {
            tagline: (chunks) => <span className="font-semibold italic text-primary">{chunks}</span>,
          })}
        </p>
        {/* <div className="mt-space-xl grid w-full grid-cols-2 gap-space-md lg:grid-cols-4">
          <div className="flex flex-col items-center rounded-xl bg-surface-container-lowest/80 p-space-lg shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md">
            <div className="mb-space-sm flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
              <span className="material-symbols-outlined text-[20px]">palette</span>
            </div>
            <span className="text-headline-lg font-bold tracking-tight text-primary">{analysisCount}</span>
            <span className="mt-space-xs text-label-md text-on-surface-variant">{t('stat1Label')}</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-surface-container-lowest/80 p-space-lg shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md">
            <div className="mb-space-sm flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <span className="text-headline-lg font-bold tracking-tight text-secondary">{t('stat2Value')}</span>
            <span className="mt-space-xs text-label-md text-on-surface-variant">{t('stat2Label')}</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-surface-container-lowest/80 p-space-lg shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md">
            <div className="mb-space-sm flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary">
              <span className="material-symbols-outlined text-[20px]">checkroom</span>
            </div>
            <span className="text-headline-lg font-bold tracking-tight text-primary">{t('stat3Value')}</span>
            <span className="mt-space-xs text-label-md text-on-surface-variant">{t('stat3Label')}</span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-surface-container-lowest/80 p-space-lg shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md">
            <div className="mb-space-sm flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
              <span className="material-symbols-outlined text-[20px]">star</span>
            </div>
            <span className="text-headline-lg font-bold tracking-tight text-tertiary">{t('stat4Value')}</span>
            <span className="mt-space-xs text-label-md text-on-surface-variant">{t('stat4Label')}</span>
          </div>
        </div> */}
      </div>
    </section>
  )
}
