import FaqSection from '@/components/faq/FaqSection'
import FaqSupportBanner from '@/components/faq/FaqSupportBanner'
import { getFaqItems } from '@/lib/faq'
import { getDb } from '@/lib/getDb'

export default function FaqPage() {
  const items = getFaqItems(getDb())

  return (
    <main className="w-full bg-surface">
      <FaqSection items={items} />
      <FaqSupportBanner />
    </main>
  )
}
