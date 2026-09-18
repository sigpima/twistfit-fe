'use client'

import { useTranslations } from 'next-intl'
import { AXIS_VALUE_DOT_COLORS, AXIS_VALUE_LABELS } from '@/lib/axisValueLabels'
import type { AxisValue } from '@/lib/db'

export type ColorMetricsResult = {
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
  hueScore?: number | null
  valueScore?: number | null
  chromaScore?: number | null
}

function useMetricItems(t: ReturnType<typeof useTranslations>, result: ColorMetricsResult) {
  return [
    { key: 'value', label: t('valueLabel'), value: result.valueResult, score: result.valueScore },
    { key: 'hue', label: t('hueLabel'), value: result.hueResult, score: result.hueScore },
    { key: 'chroma', label: t('chromaLabel'), value: result.chromaResult, score: result.chromaScore },
  ] as const
}

export function ColorMetricsSummary({ result }: { result: ColorMetricsResult }) {
  const t = useTranslations('PersonalColor.Result.Metrics')
  const items = useMetricItems(t, result)

  return (
    <div className="mt-5 border-t border-[#7b89ba]/15 pt-4">
      <h4 className="mb-3 text-label-sm font-bold uppercase tracking-wide text-[#304461]/70">
        {t('summaryHeading')}
      </h4>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col items-center gap-1 text-center">
            <span
              className="h-3.5 w-3.5 rounded-full"
              style={{ backgroundColor: AXIS_VALUE_DOT_COLORS[item.value] }}
              aria-hidden="true"
            />
            <span className="text-[11px] text-[#304461]/70">{item.label}</span>
            <span className="text-xs font-bold text-[#304461]">{AXIS_VALUE_LABELS[item.value]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ColorMetricsDetail({ result }: { result: ColorMetricsResult }) {
  const t = useTranslations('PersonalColor.Result.Metrics')
  const items = useMetricItems(t, result)

  return (
    <section
      aria-labelledby="color-metrics-title"
      className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]"
    >
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#304461]" id="color-metrics-title">
        <span className="material-symbols-outlined text-[18px] text-[#7b89ba]">tune</span>
        {t('heading')}
      </h2>
      <div className="flex flex-col gap-5">
        {items.map((item) => (
          <div key={item.key}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#304461]">{item.label}</span>
              {typeof item.score === 'number' && (
                <span className="text-xs font-bold text-[#304461]/60">{item.score}/100</span>
              )}
            </div>
            {typeof item.score === 'number' && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef4fa]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.score}%`, backgroundColor: AXIS_VALUE_DOT_COLORS[item.value] }}
                />
              </div>
            )}
            <p className="mt-1 text-[11px] text-[#304461]/60">{AXIS_VALUE_LABELS[item.value]}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
