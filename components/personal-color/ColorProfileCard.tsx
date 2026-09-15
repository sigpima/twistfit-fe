'use client'

import { useTranslations } from 'next-intl'
import { SEASON_PROFILES } from '@/lib/seasonProfiles'
import type { AxisValue, SubSeason } from '@/lib/db'

const AXIS_VALUE_LABELS: Record<AxisValue, string> = {
  warm: 'Ấm',
  cool: 'Lạnh',
  neutral: 'Trung tính',
  dark: 'Sẫm',
  light: 'Sáng',
  medium: 'Trung bình',
  bright: 'Tươi sáng',
  muted: 'Trầm',
}

export type ProfileCardResult = {
  subSeason: SubSeason
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
}

export default function ColorProfileCard({ result }: { result: ProfileCardResult }) {
  const t = useTranslations('PersonalColor.Result.ProfileCard')
  const profile = SEASON_PROFILES[result.subSeason]

  return (
    <section aria-labelledby="primary-analysis-title" className="flex flex-col gap-6 lg:col-span-7">
      <h2 className="sr-only" id="primary-analysis-title">
        {t('srHeading')}
      </h2>
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-[#7b89ba]/15 bg-white p-5 shadow-[0_4px_20px_rgba(48,68,97,0.05)] md:flex-row md:items-stretch sm:p-6">
        <div className="relative w-full max-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[#7b89ba]/20 bg-[#eef4fa] shadow-inner md:w-5/12 md:max-w-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/personal-color/portrait-winter.jpg"
            alt={t('portraitAlt')}
            className="aspect-[4/5] h-full w-full object-cover object-center"
          />
        </div>
        <div className="flex w-full flex-col justify-between py-1 md:w-7/12">
          <div>
            <div className="mb-3 inline-block rounded-full border border-[#7b89ba]/20 bg-[#eef4fa] px-3 py-1 text-xs font-semibold text-[#7b89ba]">
              {t('paletteLabel')}
            </div>
            <div className="mb-3 flex items-center gap-3.5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a89dc] to-[#7b89ba] text-white shadow-md">
                <span className="material-symbols-outlined text-[24px]">ac_unit</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#304461]">{profile.displayName}</h3>
              </div>
            </div>
            <p className="mb-5 text-xs leading-relaxed text-[#304461]/80 sm:text-[13px]">{profile.description}</p>
          </div>
          <div className="border-t border-[#7b89ba]/15 pt-4">
            <h4 className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#304461] md:text-left">
              {t('overviewHeading')}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-2 text-center">
                <span className="text-[10px] text-[#304461]/70">{t('hueLabel')}</span>
                <span className="text-xs font-bold text-[#304461]">{AXIS_VALUE_LABELS[result.hueResult]}</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-2 text-center">
                <span className="text-[10px] text-[#304461]/70">{t('valueLabel')}</span>
                <span className="text-xs font-bold text-[#4a89dc]">{AXIS_VALUE_LABELS[result.valueResult]}</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-2 text-center">
                <span className="text-[10px] text-[#304461]/70">{t('chromaLabel')}</span>
                <span className="text-xs font-bold text-[#D84B85]">{AXIS_VALUE_LABELS[result.chromaResult]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#304461]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7b89ba]" />
            {t('idealPaletteHeading')}
          </h3>
          <span className="rounded-full bg-[#7b89ba]/10 px-2.5 py-1 text-[11px] font-medium text-[#7b89ba]">
            {t('idealPaletteBadge')}
          </span>
        </div>
        <div className="grid grid-cols-6 place-items-center gap-2 py-2 sm:gap-3">
          {profile.paletteHex.map((hex) => (
            <div
              key={hex}
              className="h-9 w-9 cursor-pointer rounded-full border border-black/10 transition-transform hover:scale-[1.18]"
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border-t border-[#7b89ba]/10 bg-[#eef4fa]/50 p-3 pt-4 sm:items-center">
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#fdc8e9]/50 text-[#7b89ba] sm:mt-0">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          </div>
          <p className="text-xs leading-relaxed text-[#304461]/80">{t('paletteNote')}</p>
        </div>
      </div>
    </section>
  )
}
