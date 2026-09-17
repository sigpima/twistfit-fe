'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { WardrobeItem } from '@/lib/wardrobe'

export default function WardrobeSection() {
  const t = useTranslations('Collection.Wardrobe')
  const [items, setItems] = useState<WardrobeItem[] | null>(null)

  useEffect(() => {
    apiFetch('/wardrobe/items')
      .then((response) => (response.ok ? response.json() : []))
      .then(setItems)
  }, [])

  return (
    <section className="rounded-3xl border border-outline bg-surface-container-lowest p-6 shadow-[0_12px_36px_rgba(4,28,55,0.06)] sm:p-8">
      <h2 className="mb-6 text-headline-sm font-bold text-on-surface">{t('heading')}</h2>
      {items === null && <p className="text-body-md text-on-surface-variant">{t('loading')}</p>}
      {items !== null && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-8 text-center">
          <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
          <Link
            href="/outfit/step-1"
            className="rounded-full bg-primary px-6 py-2.5 text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary-container"
          >
            {t('emptyStateCta')}
          </Link>
        </div>
      )}
      {items !== null && items.length > 0 && (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.id}
              src={item.blobUrl}
              alt={t('itemImageAlt')}
              className="aspect-square w-full rounded-2xl bg-surface object-cover shadow-sm"
            />
          ))}
        </div>
      )}
    </section>
  )
}
