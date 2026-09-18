'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

const LINKS = [
  { key: 'wardrobe', href: '/outfit/step-1', icon: 'checkroom' },
  { key: 'saved', href: '/collection', icon: 'favorite' },
  { key: 'result', href: '/personal-color/result', icon: 'auto_awesome' },
] as const

export default function ProfileQuickLinks() {
  const t = useTranslations('Profile.QuickLinks')

  return (
    <div className="rounded-3xl border border-outline bg-surface-container-lowest p-6 shadow-[0_12px_36px_rgba(4,28,55,0.06)] sm:p-8">
      <h2 className="mb-4 text-headline-sm font-bold text-on-surface">{t('heading')}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {LINKS.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className="flex items-center justify-center gap-2 rounded-2xl border border-outline-variant px-4 py-3 text-label-lg font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
          >
            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
            <span>{t(`links.${link.key}`)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
