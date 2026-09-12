'use client'

import { useTranslations } from 'next-intl'

export const FAQ_CATEGORIES = [
  { id: 'all', key: 'all' },
  { id: 'personal-color', key: 'personalColor' },
  { id: 'fitting-room', key: 'fittingRoom' },
  { id: 'account', key: 'account' },
  { id: 'stylist', key: 'stylist' },
] as const

type FaqCategoryTabsProps = {
  active: string
  onChange: (categoryId: string) => void
}

export default function FaqCategoryTabs({ active, onChange }: FaqCategoryTabsProps) {
  const t = useTranslations('Faq.CategoryTabs')

  return (
    <div className="flex items-center gap-space-xs overflow-x-auto pb-space-sm md:justify-center">
      {FAQ_CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          className={`shrink-0 rounded-full px-space-lg py-space-sm text-label-lg transition-all duration-200 ${
            active === category.id
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {t(`categories.${category.key}`)}
        </button>
      ))}
    </div>
  )
}
