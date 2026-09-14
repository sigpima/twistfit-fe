'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import CameraArButton from './CameraArButton'

const METRICS: {
  key: 'skinBrightness' | 'warmCoolTone' | 'vividness'
  value: number
  gradient: string
  noteClass?: string
}[] = [
  {
    key: 'skinBrightness',
    value: 62,
    gradient: 'from-amber-200 via-rose-200 to-[#D4B5A5]',
  },
  {
    key: 'warmCoolTone',
    value: 22,
    gradient: 'from-blue-500 to-indigo-400',
    noteClass: 'font-medium text-[#4a89dc]',
  },
  {
    key: 'vividness',
    value: 78,
    gradient: 'from-purple-400 to-[#9F72E8]',
    noteClass: 'font-medium text-purple-600',
  },
]

const RECOMMENDATIONS = [
  {
    key: 'outfitColor',
    swatch: (
      <div className="flex h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl shadow-xs">
        <div className="h-full w-1/4 bg-[#164B99]" />
        <div className="h-full w-1/4 bg-[#3572C6]" />
        <div className="h-full w-1/4 bg-[#E06C9F]" />
        <div className="h-full w-1/4 bg-[#F4F6F9]" />
      </div>
    ),
  },
  {
    key: 'lipstickColor',
    swatch: (
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#981E48] via-[#C43372] to-[#E9769B] text-white shadow-xs">
        <span className="material-symbols-outlined text-[20px]">favorite</span>
      </div>
    ),
  },
  {
    key: 'hairColor',
    swatch: (
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#191919] via-[#2D2A32] to-[#40394A] text-white/75 shadow-xs">
        <span className="material-symbols-outlined text-[20px]">content_cut</span>
      </div>
    ),
  },
  {
    key: 'accessoryColor',
    swatch: (
      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E2E8F0] via-[#CBD5E1] to-[#64748B] text-white shadow-xs">
        <span className="material-symbols-outlined text-[20px]">diamond</span>
      </div>
    ),
  },
] as const

export default function ColorInsights() {
  const t = useTranslations('PersonalColor.Result.Insights')

  return (
    <section aria-labelledby="metrics-and-guide-title" className="flex flex-col gap-6 lg:col-span-5">
      <h2 className="sr-only" id="metrics-and-guide-title">
        {t('srHeading')}
      </h2>
      <div className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]">
        <div className="mb-5 flex items-center gap-2.5 border-b border-[#7b89ba]/15 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef4fa] text-[#7b89ba]">
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </div>
          <h3 className="text-base font-bold text-[#304461]">{t('metricsHeading')}</h3>
        </div>
        <div className="space-y-5">
          {METRICS.map((metric) => (
            <div key={metric.key}>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-[#304461]">{t(`metrics.${metric.key}.label`)}</span>
                <span className="font-mono font-bold text-[#304461]">
                  {metric.value} <span className="font-normal text-[#304461]/40">/ 100</span>
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border border-gray-200/50 bg-gray-100 p-0.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${metric.gradient}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-[#304461]/60">
                <span className={metric.noteClass}>{t(`metrics.${metric.key}.note`)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]">
        <div className="mb-4 flex items-center gap-2.5 border-b border-[#7b89ba]/15 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fdc8e9]/40 text-[#304461]">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
          </div>
          <h3 className="text-base font-bold text-[#304461]">{t('recommendationsHeading')}</h3>
        </div>
        <div className="space-y-3.5">
          {RECOMMENDATIONS.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3.5 rounded-2xl border border-[#7b89ba]/10 bg-[#eef4fa]/50 p-2.5 transition-colors hover:bg-[#eef4fa]"
            >
              {item.swatch}
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#304461]">{t(`recommendations.${item.key}.title`)}</h4>
                <p className="mt-0.5 text-[11px] leading-snug text-[#304461]/80">
                  {t(`recommendations.${item.key}.body`)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#7b89ba]/20 bg-gradient-to-r from-[#eef4fa] via-indigo-50/60 to-pink-50/60 p-3.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#7b89ba]/20 text-[#7b89ba]">
            <span className="material-symbols-outlined text-[16px]">favorite</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#304461]">{t('ctaBannerTitle')}</p>
            <p className="text-[11px] text-[#304461]/75">{t('ctaBannerSubtitle')}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/outfit/step-1"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#304461] px-5 py-3 text-center text-xs font-bold text-white shadow-md transition-all hover:bg-[#233247] hover:shadow-lg"
        >
          <span className="material-symbols-outlined text-[16px]">checkroom</span>
          <span>{t('tryOutfitButton')}</span>
        </Link>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#7b89ba]/30 bg-white px-4 py-3 text-xs font-semibold text-[#304461] transition-all hover:border-[#7b89ba] hover:bg-[#eef4fa] sm:w-auto"
        >
          <span className="material-symbols-outlined text-[16px] text-rose-500">picture_as_pdf</span>
          <span>{t('downloadPdfButton')}</span>
        </button>
        <CameraArButton />
      </div>
    </section>
  )
}
