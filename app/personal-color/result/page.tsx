'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import ColorProfileCard from '@/components/personal-color/ColorProfileCard'
import ColorInsights from '@/components/personal-color/ColorInsights'

export default function ResultPage() {
  const t = useTranslations('PersonalColor.Result.Page')

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <nav className="mb-3 flex items-center gap-2 text-xs font-medium text-[#7b89ba]">
          <Link href="/" className="hover:underline">
            {t('breadcrumbHome')}
          </Link>
          <span className="material-symbols-outlined text-[10px] opacity-60">chevron_right</span>
          <Link href="/personal-color/quiz" className="hover:underline">
            {t('breadcrumbQuiz')}
          </Link>
          <span className="material-symbols-outlined text-[10px] opacity-60">chevron_right</span>
          <span className="font-semibold text-[#304461]">{t('breadcrumbCurrent')}</span>
        </nav>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5 sm:items-center">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#7b89ba]/15 text-lg text-[#7b89ba] shadow-sm">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#304461] sm:text-3xl">{t('heading')}</h1>
              <p className="mt-0.5 text-xs font-normal text-[#304461]/80 sm:text-sm">{t('subheading')}</p>
            </div>
          </div>
          <div className="self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs">
              <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
              <span>{t('accuracyBadge')}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <ColorProfileCard />
        <ColorInsights />
      </div>
    </main>
  )
}
