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
  image: string
}

export const FAQ_CATEGORY_VISUALS: FaqCategoryVisual[] = [
  {
    id: 'account',
    key: 'account',
    icon: 'manage_accounts',
    tint: 'bg-tertiary-fixed text-tertiary',
    image: '/faq/account.jpg',
  },
  {
    id: 'personal-color',
    key: 'personalColor',
    icon: 'palette',
    tint: 'bg-primary-fixed text-primary',
    image: '/faq/personal-color.jpg',
  },
  {
    id: 'fitting-room',
    key: 'fittingRoom',
    icon: 'checkroom',
    tint: 'bg-secondary-fixed text-secondary',
    image: '/faq/fitting-room.jpg',
  },
  {
    id: 'policy',
    key: 'policy',
    icon: 'gavel',
    tint: 'bg-secondary-container text-on-secondary-container',
    image: '/faq/policy.jpg',
  },
]
