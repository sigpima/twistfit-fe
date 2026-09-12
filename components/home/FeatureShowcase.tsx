'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'

const TABS = [
  { icon: 'styler', key: 'outfit' },
  { icon: 'palette', key: 'colorTest' },
  { icon: 'forum', key: 'community' },
] as const

export default function FeatureShowcase() {
  const t = useTranslations('Home.FeatureShowcase')
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section id="features-section" className="w-full bg-surface-container-lowest/60 py-space-xl">
      <div className="mx-auto max-w-7xl px-margin-desktop">
        <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary-fixed px-3.5 py-1 text-label-sm text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            <span>{t('badgePill')}</span>
          </div>
          <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
          <p className="mt-2 text-body-lg text-on-surface-variant">{t('subheading')}</p>
        </div>
        <div className="mb-10 flex justify-center overflow-x-auto pb-2">
          <div role="tablist" className="inline-flex gap-1 rounded-full bg-surface-container p-1.5 shadow-inner">
            {TABS.map((tab, index) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-label-lg transition-all ${
                  activeTab === index
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{t(`tabs.${tab.key}`)}</span>
              </button>
            ))}
          </div>
        </div>
        {activeTab === 0 && <SmartOutfitPanel />}
        {activeTab === 1 && <PersonalColorPanel />}
        {activeTab === 2 && <CommunityPanel />}
      </div>
    </section>
  )
}

const OUTFIT_STEPS = [
  { step: '1', badge: 'bg-secondary-container text-on-secondary-fixed', key: 'uploadItems' },
  { step: '2', badge: 'bg-primary-fixed text-primary', key: 'chooseModel' },
  { step: '3', badge: 'bg-tertiary-fixed text-on-tertiary-fixed', key: 'viewResult' },
] as const

function SmartOutfitPanel() {
  const t = useTranslations('Home.FeatureShowcase')

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-low p-6 shadow-sm lg:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_fix_high</span>
            <h3 className="text-headline-sm text-on-surface">{t('outfitPanel.studioTitle')}</h3>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
            {t('outfitPanel.autoBgRemovalBadge')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-on-surface-variant">{t('outfitPanel.step1Label')}</p>
            <div className="mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-surface-container p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/studio-outfit.jpg" alt={t('outfitPanel.garmentAlt')} className="h-full w-full object-contain" />
            </div>
            <div className="grid w-full grid-cols-3 gap-1">
              <div className="flex h-6 items-center justify-center rounded bg-primary-fixed text-[9px] font-bold text-primary">
                {t('outfitPanel.tagTop')}
              </div>
              <div className="flex h-6 items-center justify-center rounded bg-surface-container text-[9px] text-on-surface-variant">
                {t('outfitPanel.tagDress')}
              </div>
              <div className="flex h-6 items-center justify-center rounded bg-surface-container text-[9px] text-on-surface-variant">
                {t('outfitPanel.tagGlasses')}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-on-surface-variant">{t('outfitPanel.step2Label')}</p>
            <div className="grid w-full grid-cols-2 gap-1.5">
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-short-hair.jpg" alt={t('outfitPanel.modelShortHairAlt')} className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-long-curl.jpg" alt={t('outfitPanel.modelLongCurlAlt')} className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-tall.jpg" alt={t('outfitPanel.modelTallAlt')} className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="flex aspect-square flex-col items-center justify-center rounded-lg bg-secondary-fixed text-secondary">
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                <span className="mt-0.5 text-[8px] font-bold">{t('outfitPanel.uploadPhoto')}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-primary">{t('outfitPanel.step3Label')}</p>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-container shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/model-tryon-result.jpg"
                alt={t('outfitPanel.tryonResultAlt')}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-1 right-1 rounded bg-on-surface/80 px-1.5 py-0.5 text-[8px] text-surface-container-lowest">
                {t('outfitPanel.matchBadge')}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container-lowest px-2 pt-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">hd</span>
            <span className="text-label-sm text-on-surface">{t('outfitPanel.hdModeLabel')}</span>
          </div>
          <div className="flex h-5 w-10 items-center justify-end rounded-full bg-primary p-0.5">
            <div className="h-4 w-4 rounded-full bg-on-primary shadow-sm" />
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-primary">{t('outfitPanel.featureTag')}</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">{t('outfitPanel.panelHeading')}</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">{t('outfitPanel.panelBody')}</p>
        </div>
        <div className="space-y-4">
          {OUTFIT_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-high/40">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{t(`outfitPanel.steps.${item.key}.title`)}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{t(`outfitPanel.steps.${item.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
          >
            <span>{t('outfitPanel.cta')}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  )
}

const COLOR_TEST_STEPS = [
  { step: '1', badge: 'bg-secondary-container text-on-secondary-fixed', key: 'scanQr' },
  { step: '2', badge: 'bg-primary-fixed text-primary', key: 'alignFace' },
  { step: '3', badge: 'bg-tertiary-fixed text-on-tertiary-fixed', key: 'getReport' },
] as const

const SPECTRUM_METRICS = [
  { key: 'brightness', value: 68, color: 'bg-secondary' },
  { key: 'coolTone', value: 84, color: 'bg-primary' },
  { key: 'contrast', value: 76, color: 'bg-secondary-container' },
] as const

const SPECTRUM_RECOMMENDATIONS = [
  { icon: 'checkroom', badge: 'bg-primary-fixed text-primary', key: 'outfit' },
  { icon: 'brush', badge: 'bg-secondary-fixed text-secondary', key: 'lipstick' },
  { icon: 'diamond', badge: 'bg-tertiary-fixed text-tertiary', key: 'accessory' },
] as const

function PersonalColorPanel() {
  const t = useTranslations('Home.FeatureShowcase')
  const { openQrModal } = useQrModal()

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">palette</span>
            <span className="text-label-lg font-bold text-on-surface">{t('colorTestPanel.resultTitle')}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#16a34a]">
            <span className="material-symbols-outlined text-[14px]">check_circle</span> {t('colorTestPanel.accuracyBadge')}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h4 className="text-label-md font-bold text-on-surface">{t('colorTestPanel.spectrumHeading')}</h4>
            {SPECTRUM_METRICS.map((metric) => (
              <div key={metric.key}>
                <div className="mb-1 flex justify-between text-xs font-medium">
                  <span className="text-on-surface-variant">{t(`colorTestPanel.metrics.${metric.key}`)}</span>
                  <span className="font-bold text-on-surface">{metric.value} / 100</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className={`h-full rounded-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h4 className="text-label-md font-bold text-on-surface">{t('colorTestPanel.recommendationsHeading')}</h4>
            {SPECTRUM_RECOMMENDATIONS.map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-xs">
                <div className={`flex h-6 w-6 items-center justify-center rounded font-bold ${item.badge}`}>
                  <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">{t(`colorTestPanel.recommendations.${item.key}.title`)}</p>
                  <p className="text-[11px] text-on-surface-variant">{t(`colorTestPanel.recommendations.${item.key}.body`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary-fixed/50 p-3">
          <span className="material-symbols-outlined text-[24px] text-secondary">phonelink_ring</span>
          <p className="text-body-sm text-on-secondary-fixed-variant">
            {t.rich('colorTestPanel.tip', { bold: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-secondary">{t('colorTestPanel.featureTag')}</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">{t('colorTestPanel.panelHeading')}</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">{t('colorTestPanel.panelBody')}</p>
        </div>
        <div className="space-y-4">
          {COLOR_TEST_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{t(`colorTestPanel.steps.${item.key}.title`)}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{t(`colorTestPanel.steps.${item.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={openQrModal}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-3.5 text-label-lg text-on-secondary shadow-md transition-all hover:bg-secondary/90"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            <span>{t('colorTestPanel.cta')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const COMMUNITY_POSTS = [
  { key: 'anNhien', image: '/home/street-outfit-hanoi.jpg', tagColor: 'text-primary', likes: 428 },
  { key: 'minhKhue', image: '/home/blazer-outfit.jpg', tagColor: 'text-secondary', likes: 852 },
] as const

const COMMUNITY_STEPS = [
  { step: '1', badge: 'bg-secondary-container text-on-secondary-fixed', key: 'shareLookbook' },
  { step: '2', badge: 'bg-primary-fixed text-primary', key: 'getFeedback' },
  { step: '3', badge: 'bg-tertiary-fixed text-on-tertiary-fixed', key: 'saveCollection' },
] as const

function CommunityPanel() {
  const t = useTranslations('Home.FeatureShowcase')

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">groups</span>
            <span className="text-label-lg font-bold text-on-surface">{t('communityPanel.title')}</span>
          </div>
          <span className="text-xs font-semibold text-primary">{t('communityPanel.hashtags')}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {COMMUNITY_POSTS.map((post) => (
            <div key={post.key} className="overflow-hidden rounded-2xl bg-surface-container-low shadow-sm">
              <div className="relative h-44 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.image} alt={t(`communityPanel.posts.${post.key}.imageAlt`)} className="h-full w-full object-cover" />
                <span className={`absolute right-2 top-2 rounded-full bg-surface-container-lowest/80 px-2 py-0.5 text-[10px] font-bold ${post.tagColor}`}>
                  {t(`communityPanel.posts.${post.key}.tag`)}
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm font-bold text-on-surface">{t(`communityPanel.posts.${post.key}.author`)}</span>
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <span className="material-symbols-outlined text-[14px]">favorite</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] text-on-surface-variant">{t(`communityPanel.posts.${post.key}.caption`)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container p-3">
          <span className="text-xs font-medium text-on-surface">{t('communityPanel.statsLabel')}</span>
          <span className="text-xs font-bold text-primary">{t('communityPanel.joinNow')}</span>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-tertiary">{t('communityPanel.featureTag')}</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">{t('communityPanel.panelHeading')}</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">{t('communityPanel.panelBody')}</p>
        </div>
        <div className="space-y-4">
          {COMMUNITY_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{t(`communityPanel.steps.${item.key}.title`)}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{t(`communityPanel.steps.${item.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-tertiary px-8 py-3.5 text-label-lg text-on-tertiary shadow-md transition-all hover:bg-tertiary/90"
          >
            <span>{t('communityPanel.cta')}</span>
            <span className="material-symbols-outlined text-[18px]">explore</span>
          </a>
        </div>
      </div>
    </div>
  )
}
