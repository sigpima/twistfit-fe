'use client'

import { useTranslations } from 'next-intl'

const ROWS = [
  { icon: 'payments', key: 'cost' },
  { icon: 'schedule', key: 'time' },
  { icon: 'tune', key: 'objectivity' },
  { icon: 'checkroom', key: 'virtualTryOn' },
  { icon: 'history_edu', key: 'storage' },
] as const

export default function ComparisonTable() {
  const t = useTranslations('HowItWorks.ComparisonTable')

  return (
    <section className="mx-auto w-full max-w-5xl px-margin py-space-xl sm:px-margin-desktop lg:py-24">
      <div className="mb-16 text-center">
        <span className="text-label-sm font-bold uppercase tracking-wider text-secondary">{t('kicker')}</span>
        <h2 className="mt-1 text-headline-lg font-bold text-on-surface">{t('heading')}</h2>
        <p className="mt-space-xs text-body-md text-on-surface-variant">{t('subheading')}</p>
      </div>
      <div className="overflow-x-auto rounded-3xl bg-surface-container-lowest shadow-xl">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="border-b border-surface-container bg-surface-container-low">
              <th className="w-1/3 p-space-lg text-headline-sm text-on-surface">{t('colCriteria')}</th>
              <th className="w-1/3 p-space-lg text-headline-sm text-on-surface-variant">{t('colTraditional')}</th>
              <th className="w-1/3 bg-primary-fixed/20 p-space-lg text-headline-sm font-bold text-primary">
                {t('colTwistfit')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high text-body-md text-on-surface-variant">
            {ROWS.map((row) => (
              <tr key={row.key}>
                <td className="flex items-center gap-space-xs p-space-lg font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-primary">{row.icon}</span>
                  {t(`rows.${row.key}.label`)}
                </td>
                <td className="p-space-lg">{t(`rows.${row.key}.traditional`)}</td>
                <td className="bg-primary-fixed/10 p-space-lg font-bold text-primary">
                  {t(`rows.${row.key}.twistfit`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
