'use client'

import { useTranslations } from 'next-intl'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'
import FeatureSection from './FeatureSection'

export default function FeatureShowcase() {
  const t = useTranslations('Home.FeatureShowcase')
  const { openQrModal } = useQrModal()

  return (
    <section id="features-section" className="w-full bg-surface-container-lowest/60 py-space-xl">
      <div className="mx-auto max-w-7xl px-margin-desktop">
        <div className="mx-auto mb-16 flex max-w-3xl flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary-fixed px-3.5 py-1 text-label-sm text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            <span>{t('badgePill')}</span>
          </div>
          <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
          <p className="mt-2 text-body-lg text-on-surface-variant">{t('subheading')}</p>
        </div>
        <div className="flex flex-col gap-16">
          <FeatureSection
            featureKey="colorTest"
            accentClassName="text-secondary"
            cta={{ label: t('features.colorTest.cta'), onClick: openQrModal }}
          />
          <FeatureSection
            featureKey="outfit"
            accentClassName="text-primary"
            cta={{ label: t('features.outfit.cta'), href: '/outfit/step-1' }}
          />
          <FeatureSection
            featureKey="community"
            accentClassName="text-tertiary"
            cta={{ label: t('features.community.cta'), href: '/forum' }}
          />
        </div>
      </div>
    </section>
  )
}
