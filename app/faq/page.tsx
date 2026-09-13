import FaqSection from '@/components/faq/FaqSection'
import FaqSupportBanner from '@/components/faq/FaqSupportBanner'
import { apiFetch } from '@/lib/apiClient'
import type { FaqItem } from '@/lib/faq'

export default async function FaqPage() {
  const response = await apiFetch('/faq', { cache: 'no-store' })
  const items = response.ok ? ((await response.json()) as FaqItem[]) : []

  return (
    <main className="w-full bg-surface">
      <FaqSection items={items} />
      <FaqSupportBanner />
    </main>
  )
}
