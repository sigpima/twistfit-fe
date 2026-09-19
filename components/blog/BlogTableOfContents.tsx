'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import type { HeadingEntry } from '@/lib/markdown'

export default function BlogTableOfContents({ headings }: { headings: HeadingEntry[] }) {
  const t = useTranslations('Blog.TableOfContents')
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) return

    // How far from the top of the viewport counts as "currently reading" —
    // clears the sticky site header (h-20-ish) plus a little breathing room.
    const READING_LINE_PX = 120

    // Recomputed from live geometry on every observer callback (not from
    // which specific entries changed) so it stays correct even after a big
    // jump — a TOC click, a #hash deep link, or a dragged scrollbar — where
    // some headings may never individually cross the intersection boundary.
    function updateActiveHeading() {
      let current = elements[0]
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= READING_LINE_PX) {
          current = element
        }
      }
      setActiveId(current.id)
    }

    const observer = new IntersectionObserver(updateActiveHeading, {
      rootMargin: `-${READING_LINE_PX}px 0px 0px 0px`,
      threshold: [0, 1],
    })
    elements.forEach((element) => observer.observe(element))
    updateActiveHeading()
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav
      aria-label={t('ariaLabel')}
      className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-space-lg"
    >
      <span className="text-label-sm font-bold uppercase tracking-widest text-primary">{t('heading')}</span>
      <ul className="mt-space-sm flex flex-col gap-1 border-l border-outline-variant">
        {headings.map((item) => {
          const isActive = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                className={`-ml-px block border-l-2 py-1 text-body-md transition-colors ${
                  item.depth === 3 ? 'pl-space-lg' : 'pl-space-sm'
                } ${
                  isActive
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
