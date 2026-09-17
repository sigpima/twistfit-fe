export const ACCESSORY_CATEGORIES = ['tui-xach', 'giay', 'trang-suc', 'mu-non', 'khan'] as const
export type AccessoryCategory = (typeof ACCESSORY_CATEGORIES)[number]

export const ACCESSORY_STYLE_TAGS = ['casual', 'minimalist', 'street', 'formal'] as const
export const ACCESSORY_OCCASION_TAGS = ['hang-ngay', 'di-lam', 'du-tiec', 'di-bien'] as const
export const ACCESSORY_TONE_TAGS = ['spring', 'summer', 'autumn', 'winter'] as const

export type AccessoryProduct = {
  id: number
  name: string
  imageUrl: string
  affiliateLink: string
  category: string
  styleTags: string[]
  occasionTags: string[]
  toneTags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}
