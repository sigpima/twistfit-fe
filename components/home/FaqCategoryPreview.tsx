'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FAQ_CATEGORY_VISUALS } from '@/components/faq/faqCategoryVisuals'

export default function FaqCategoryPreview() {
  const t = useTranslations('Home.FaqPreview')
  const tCategories = useTranslations('Faq.CategoryTabs.categories')

  return (
    <section className="w-full bg-surface py-space-xl">
      <div className="mx-auto max-w-7xl px-margin py-space-lg md:px-margin-desktop">
        <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center text-center">
          {/* <div className="mb-3 flex items-center gap-2 rounded-full bg-surface-container px-3.5 py-1 text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
              live_help
            </span>
            <span>{t('badge')}</span>
          </div> */}
          <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
          <p className="mt-2 text-body-lg text-on-surface-variant">{t('subheading')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FAQ_CATEGORY_VISUALS.map((category) => (
            <Link
              key={category.id}
              href={`/faq?category=${category.id}`}
              className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-3xl shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={category.image}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <span className="relative p-4 text-label-lg font-semibold text-white">{tCategories(category.key)}</span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-label-lg font-semibold text-primary transition-colors hover:text-primary-container"
          >
            {t('viewAll')}
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
