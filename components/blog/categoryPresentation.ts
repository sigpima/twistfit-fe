import type { BlogCategory } from '@/lib/db'

export const CATEGORY_PRESENTATION: Record<BlogCategory, { translationKey: string; colorClass: string }> = {
  'personal-color': { translationKey: 'personalColor', colorClass: 'text-secondary' },
  styling: { translationKey: 'styling', colorClass: 'text-primary' },
  sustainable: { translationKey: 'sustainable', colorClass: 'text-tertiary' },
  beauty: { translationKey: 'beauty', colorClass: 'text-secondary' },
  community: { translationKey: 'community', colorClass: 'text-primary' },
}
