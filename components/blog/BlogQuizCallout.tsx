'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function BlogQuizCallout() {
  const t = useTranslations('Blog.QuizCallout')

  return (
    <div className="mb-space-xl flex flex-col items-center justify-between gap-space-lg rounded-3xl bg-gradient-to-r from-primary-fixed to-secondary-fixed/70 p-space-lg md:flex-row md:p-space-xl">
      <div className="flex items-center gap-space-md">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-full w-full -rotate-45 transform" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" r="40" stroke="#dbe1ff" strokeDasharray="62.8 188.4" strokeWidth="12" />
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="40"
              stroke="#fdc8e9"
              strokeDasharray="62.8 188.4"
              strokeDashoffset="-62.8"
              strokeWidth="12"
            />
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="40"
              stroke="#cdc6ae"
              strokeDasharray="62.8 188.4"
              strokeDashoffset="-125.6"
              strokeWidth="12"
            />
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="40"
              stroke="#6573a2"
              strokeDasharray="62.8 188.4"
              strokeDashoffset="-188.4"
              strokeWidth="12"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px] text-primary">palette</span>
          </div>
        </div>
        <div>
          <h4 className="text-headline-sm font-bold text-on-surface">{t('title')}</h4>
          <p className="text-body-md text-on-surface-variant">{t('body')}</p>
        </div>
      </div>
      <Link
        href="/personal-color/quiz"
        className="flex items-center gap-space-xs whitespace-nowrap rounded-full bg-on-surface px-space-lg py-space-sm text-label-lg text-surface shadow-md transition-all hover:bg-primary"
      >
        <span className="material-symbols-outlined text-[18px]">psychology</span>
        <span>{t('ctaButton')}</span>
      </Link>
    </div>
  )
}
