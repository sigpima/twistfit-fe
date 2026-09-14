import type { Garment } from '../OutfitFlowProvider'

// Occasion/style tag ids match the backend wardrobe domain's
// OCCASION_TAGS / STYLE_TAGS exactly (see
// backend/app/domains/wardrobe/schemas.py) so this mock data maps
// directly onto real API data once the closet is wired up for real.
export type OccasionTag = 'hang-ngay' | 'di-lam' | 'du-tiec' | 'di-bien'
export type StyleTag = 'casual' | 'minimalist' | 'street' | 'formal'

export type WardrobeItem = Garment & {
  occasionTags: OccasionTag[]
  styleTags: StyleTag[]
}

export const WARDROBE_ITEMS: WardrobeItem[] = [
  {
    id: 'babydoll-blue',
    name: 'Áo Babydoll Voan Xanh Nhạt',
    image: '/outfit/garment-peplum-main.jpg',
    thumbnail: '/outfit/garment-peplum-thumb.jpg',
    matchScore: '95%',
    tone: 'Light Summer',
    type: 'Áo babydoll',
    occasionTags: ['di-bien', 'hang-ngay'],
    styleTags: ['casual'],
  },
  {
    id: 'sweater-gray',
    name: 'Áo Thun Tay Dài Len Xám',
    image: '/outfit/garment-blazer-black.jpg',
    thumbnail: '/outfit/garment-blazer-black.jpg',
    matchScore: '90%',
    tone: 'Soft Autumn',
    type: 'Áo thun tay dài',
    occasionTags: ['di-lam', 'hang-ngay'],
    styleTags: ['minimalist'],
  },
  {
    id: 'tshirt-red',
    name: 'Áo Thun Cổ Chữ V Đỏ',
    image: '/outfit/garment-dress-blue.jpg',
    thumbnail: '/outfit/garment-dress-blue.jpg',
    matchScore: '88%',
    tone: 'Warm Spring',
    type: 'Áo thun cổ chữ V',
    occasionTags: ['hang-ngay'],
    styleTags: ['casual', 'street'],
  },
  {
    id: 'shorts-denim',
    name: 'Quần Short Jean Xanh',
    image: '/outfit/garment-skirt-cream.jpg',
    thumbnail: '/outfit/garment-skirt-cream.jpg',
    matchScore: '86%',
    tone: 'Cool Winter',
    type: 'Quần short jean',
    occasionTags: ['di-bien', 'hang-ngay'],
    styleTags: ['casual', 'street'],
  },
  {
    id: 'blazer-beige',
    name: 'Áo Sơ Mi Tay Dài Be',
    image: '/outfit/garment-peplum-main.jpg',
    thumbnail: '/outfit/garment-peplum-thumb.jpg',
    matchScore: '93%',
    tone: 'Autumn Warm',
    type: 'Áo sơ mi tay dài',
    occasionTags: ['di-lam', 'du-tiec'],
    styleTags: ['formal', 'minimalist'],
  },
]
