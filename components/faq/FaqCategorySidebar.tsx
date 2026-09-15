'use client'

import { useTranslations } from 'next-intl'
import { FAQ_CATEGORY_VISUALS } from './faqCategoryVisuals'

const ALL_TILE = {
  id: 'all',
  key: 'all',
  icon: 'apps',
  tint: 'bg-surface-container text-on-surface-variant',
} as const

const TILES = [ALL_TILE, ...FAQ_CATEGORY_VISUALS]

type FaqCategorySidebarProps = {
  active: string
  onChange: (categoryId: string) => void
}

export default function FaqCategorySidebar({ active, onChange }: FaqCategorySidebarProps) {
  const t = useTranslations('Faq.CategoryTabs.categories')

  return (
    <div className="relative lg:w-64 lg:shrink-0">
      <div className="flex gap-space-sm overflow-x-auto pb-space-sm lg:flex-col lg:overflow-visible lg:pb-0">
        {TILES.map((tile) => {
          const isActive = active === tile.id
          return (
            <button
              key={tile.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(tile.id)}
              className={`flex shrink-0 items-center gap-space-md rounded-2xl border p-space-md text-left transition-all duration-200 lg:w-full ${
                isActive
                  ? 'border-primary bg-primary-fixed shadow-sm'
                  : 'border-transparent bg-surface-container-lowest hover:bg-surface-container-low'
              }`}
            >
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tile.tint}`}>
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                  {tile.icon}
                </span>
              </span>
              <span
                className={`whitespace-nowrap text-label-lg font-semibold lg:whitespace-normal ${
                  isActive ? 'text-primary' : 'text-on-surface'
                }`}
              >
                {t(tile.key)}
              </span>
            </button>
          )
        })}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-surface to-transparent lg:hidden"
      />
    </div>
  )
}
