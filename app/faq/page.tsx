import FaqSection from '@/components/faq/FaqSection'
import FaqSupportBanner from '@/components/faq/FaqSupportBanner'
import { apiFetch } from '@/lib/apiClient'
import { FAQ_CATEGORIES } from '@/lib/faq'
import type { FaqItem } from '@/lib/faq'
import { buildFaqPageJsonLd } from '@/lib/jsonLd'
import JsonLd from '@/components/seo/JsonLd'

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const response = await apiFetch('/faq', { cache: 'no-store' })
  const items = response.ok ? ((await response.json()) as FaqItem[]) : []
  const { category } = await searchParams
  const initialCategory = category && (FAQ_CATEGORIES as string[]).includes(category) ? category : 'all'

  return (
    <main className="w-full bg-surface">
      {items.length > 0 && <JsonLd data={buildFaqPageJsonLd(items)} />}
      <FaqSection items={items} initialCategory={initialCategory} />
      <FaqSupportBanner />
    </main>
  )
}
