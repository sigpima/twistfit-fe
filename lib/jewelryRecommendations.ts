import type { SubSeason } from './db'

export type JewelryRecommendation = {
  colors: string
  image: string
}

export const JEWELRY_RECOMMENDATIONS: Record<SubSeason, JewelryRecommendation> = {
  'light-spring': {
    colors: 'Vàng sáng nhạt (Light/Champagne Gold), Vàng hồng sáng',
    image: '/personal-color/recommendations/jewelry/light-spring.png',
  },
  'true-spring': {
    colors: 'Vàng Gold truyền thống (18K–24K), Đồng đỏ, Đồng thau',
    image: '/personal-color/recommendations/jewelry/true-spring.png',
  },
  'bright-spring': {
    colors: 'Vàng Gold sáng chói, Vàng hồng bóng (Bright Rose Gold)',
    image: '/personal-color/recommendations/jewelry/bright-spring.png',
  },
  'light-summer': {
    colors: 'Bạc sáng thanh mảnh, Vàng trắng nhạt',
    image: '/personal-color/recommendations/jewelry/light-summer.png',
  },
  'true-summer': {
    colors: 'Bạc cổ điển, Bạch kim',
    image: '/personal-color/recommendations/jewelry/true-summer.png',
  },
  'soft-summer': {
    colors: 'Bạc xước (Brushed Silver), Vàng hồng nhạt (Soft Rose Gold)',
    image: '/personal-color/recommendations/jewelry/soft-summer.png',
  },
  'soft-autumn': {
    colors: 'Vàng đồng mờ, Vàng hồng ấm (Warm Rose Gold), Đồng thau nhạt',
    image: '/personal-color/recommendations/jewelry/soft-autumn.png',
  },
  'true-autumn': {
    colors: 'Vàng Gold truyền thống (18K–24K), Đồng đỏ, Đồng thau',
    image: '/personal-color/recommendations/jewelry/true-autumn.png',
  },
  'deep-autumn': {
    colors: 'Vàng đồng đậm (Antique Gold), Đồng hun, Đồng thau đậm',
    image: '/personal-color/recommendations/jewelry/deep-autumn.png',
  },
  'deep-winter': {
    colors: 'Bạc hun khói, Kim loại súng (Gunmetal), Titan',
    image: '/personal-color/recommendations/jewelry/deep-winter.png',
  },
  'true-winter': {
    colors: 'Bạc nguyên chất, Bạch kim (Platinum)',
    image: '/personal-color/recommendations/jewelry/true-winter.png',
  },
  'bright-winter': {
    colors: 'Bạc sáng, Vàng trắng (White Gold), Bạch kim',
    image: '/personal-color/recommendations/jewelry/bright-winter.png',
  },
}
