'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function AnonymousResultBanner() {
  const t = useTranslations('PersonalColor.Result.AnonymousBanner')

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-3xl border border-[#7b89ba]/20 bg-gradient-to-r from-[#eef4fa] via-indigo-50/60 to-pink-50/60 p-5 sm:flex-row sm:items-center lg:col-span-12">
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#7b89ba]/20 text-[#7b89ba]">
          <span className="material-symbols-outlined text-[20px]">bookmark_add</span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#304461]">{t('title')}</p>
          <p className="text-xs text-[#304461]/80">{t('body')}</p>
        </div>
      </div>
      <div className="flex w-full flex-shrink-0 items-center gap-2 sm:w-auto">
        <Link
          href="/register"
          className="flex flex-1 items-center justify-center rounded-2xl bg-[#304461] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#233247] sm:flex-none"
        >
          {t('registerButton')}
        </Link>
        <Link
          href="/login"
          className="flex flex-1 items-center justify-center rounded-2xl border border-[#7b89ba]/30 bg-white px-4 py-2.5 text-xs font-semibold text-[#304461] transition-all hover:border-[#7b89ba] hover:bg-[#eef4fa] sm:flex-none"
        >
          {t('loginButton')}
        </Link>
      </div>
    </div>
  )
}
