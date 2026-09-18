'use client'

import { useTranslations } from 'next-intl'
import type { AxisValue } from '@/lib/db'

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

export type ColorMetricsResult = {
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
}

export default function ColorMetricsSection({ result }: { result: ColorMetricsResult }) {
  const t = useTranslations('PersonalColor.Result.Metrics')

  return (
    <section
      aria-labelledby="color-metrics-title"
      className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]"
    >
      <h2 className="mb-4 text-base font-bold text-[#304461]" id="color-metrics-title">
        {t('heading')}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-3 text-center">
          <span className="text-xs text-[#304461]/70">{t('hueLabel')}</span>
          <span className="text-sm font-bold text-[#304461]">{AXIS_VALUE_LABELS[result.hueResult]}</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-3 text-center">
          <span className="text-xs text-[#304461]/70">{t('valueLabel')}</span>
          <span className="text-sm font-bold text-[#4a89dc]">{AXIS_VALUE_LABELS[result.valueResult]}</span>
        </div>
        <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-3 text-center">
          <span className="text-xs text-[#304461]/70">{t('chromaLabel')}</span>
          <span className="text-sm font-bold text-[#D84B85]">{AXIS_VALUE_LABELS[result.chromaResult]}</span>
        </div>
      </div>
    </section>
  )
}
