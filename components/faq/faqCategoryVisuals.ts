import type { FaqCategory } from '@/lib/faq'

// Shared between the homepage FAQ teaser (components/home/FaqCategoryPreview.tsx)
// and the FAQ page's category sidebar (components/faq/FaqCategorySidebar.tsx), so
// both surfaces show the same icon/color per category. `key` matches the existing
// Faq.CategoryTabs.categories.* translation keys.
export type FaqCategoryVisual = {
  id: FaqCategory
  key: 'account' | 'personalColor' | 'fittingRoom' | 'policy'
  icon: string
  tint: string
}

export const FAQ_CATEGORY_VISUALS: FaqCategoryVisual[] = [
  { id: 'account', key: 'account', icon: 'manage_accounts', tint: 'bg-tertiary-fixed text-tertiary' },
  { id: 'personal-color', key: 'personalColor', icon: 'palette', tint: 'bg-primary-fixed text-primary' },
  { id: 'fitting-room', key: 'fittingRoom', icon: 'checkroom', tint: 'bg-secondary-fixed text-secondary' },
  {
    id: 'policy',
    key: 'policy',
    icon: 'gavel',
    tint: 'bg-secondary-container text-on-secondary-container',
  },
]
