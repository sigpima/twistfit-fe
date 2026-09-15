'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import FaqSearchBar from './FaqSearchBar'
import FaqCategorySidebar from './FaqCategorySidebar'
import FaqAccordionItem from './FaqAccordionItem'
import type { FaqItem } from '@/lib/faq'

export default function FaqSection({
  items,
  initialCategory = 'all',
}: {
  items: FaqItem[]
  initialCategory?: string
}) {
  const t = useTranslations('Faq.Section')
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [openItemId, setOpenItemId] = useState<number | null>(null)

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.categories.includes(activeCategory as never)
      const matchesSearch = !query || item.question.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [items, activeCategory, searchQuery])

  return (
    <>
      <section className="relative w-full overflow-hidden bg-surface px-margin-desktop py-space-xl">
        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-space-xs shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">live_help</span>
            <span className="text-label-sm font-semibold uppercase tracking-wider text-primary">
              {t('badgeText')}
            </span>
          </div>
          <h1 className="mt-space-md text-display-lg font-bold tracking-tight text-on-surface">
            {t('heading')}
          </h1>
          <p className="mt-space-sm max-w-2xl text-body-lg leading-relaxed text-on-surface-variant">
            {t('subheading')}
          </p>
          <FaqSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onTagClick={(tagValue) => setSearchQuery(tagValue)}
          />
        </div>
      </section>
      <section className="w-full px-margin-desktop pb-space-xl">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-space-lg lg:flex-row lg:items-start">
            <FaqCategorySidebar active={activeCategory} onChange={setActiveCategory} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-space-md">
                {visibleItems.map((item, index) => (
                  <FaqAccordionItem
                    key={item.id}
                    item={item}
                    number={String(index + 1).padStart(2, '0')}
                    isOpen={openItemId === item.id}
                    onToggle={(id) => setOpenItemId((current) => (current === id ? null : id))}
                  />
                ))}
              </div>
              {visibleItems.length === 0 && (
                <div className="mt-space-md rounded-xl bg-surface-container-lowest py-space-xl text-center shadow-sm">
                  <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
                  <h4 className="mt-space-xs text-headline-sm font-semibold text-on-surface">
                    {t('noResultsTitle')}
                  </h4>
                  <p className="mt-1 text-body-md text-on-surface-variant">{t('noResultsBody')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
