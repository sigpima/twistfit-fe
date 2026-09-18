import type { SubSeason } from './db'

export const BLUSH_RECOMMENDATIONS: Record<SubSeason, string> = {
  'light-spring': '/personal-color/recommendations/blush/light-spring.png',
  'true-spring': '/personal-color/recommendations/blush/true-spring.png',
  'bright-spring': '/personal-color/recommendations/blush/bright-spring.png',
  'light-summer': '/personal-color/recommendations/blush/light-summer.png',
  'true-summer': '/personal-color/recommendations/blush/true-summer.png',
  'soft-summer': '/personal-color/recommendations/blush/soft-summer.png',
  'soft-autumn': '/personal-color/recommendations/blush/soft-autumn.png',
  'true-autumn': '/personal-color/recommendations/blush/true-autumn.png',
  'deep-autumn': '/personal-color/recommendations/blush/deep-autumn.png',
  'deep-winter': '/personal-color/recommendations/blush/deep-winter.png',
  'true-winter': '/personal-color/recommendations/blush/true-winter.png',
  'bright-winter': '/personal-color/recommendations/blush/bright-winter.png',
}

export const LIPSTICK_RECOMMENDATIONS: Record<SubSeason, string> = {
  'light-spring': '/personal-color/recommendations/lipstick/light-spring.png',
  'true-spring': '/personal-color/recommendations/lipstick/true-spring.png',
  'bright-spring': '/personal-color/recommendations/lipstick/bright-spring.png',
  'light-summer': '/personal-color/recommendations/lipstick/light-summer.png',
  'true-summer': '/personal-color/recommendations/lipstick/true-summer.png',
  'soft-summer': '/personal-color/recommendations/lipstick/soft-summer.png',
  'soft-autumn': '/personal-color/recommendations/lipstick/soft-autumn.png',
  'true-autumn': '/personal-color/recommendations/lipstick/true-autumn.png',
  'deep-autumn': '/personal-color/recommendations/lipstick/deep-autumn.png',
  'deep-winter': '/personal-color/recommendations/lipstick/deep-winter.png',
  'true-winter': '/personal-color/recommendations/lipstick/true-winter.png',
  'bright-winter': '/personal-color/recommendations/lipstick/bright-winter.png',
}

export type SkinToneGroup = 'warm' | 'cool' | 'neutral'

// "PHÂN LOẠI TONE DA DỰA TRÊN PERSONAL COLOR": True Spring/Autumn are the
// only two seasons classified as warm, True Summer/Winter as cool, and
// every other sub-season falls into the neutral bucket.
export const TONE_GROUP_BY_SUBSEASON: Record<SubSeason, SkinToneGroup> = {
  'true-spring': 'warm',
  'true-autumn': 'warm',
  'true-summer': 'cool',
  'true-winter': 'cool',
  'light-spring': 'neutral',
  'bright-spring': 'neutral',
  'light-summer': 'neutral',
  'soft-summer': 'neutral',
  'soft-autumn': 'neutral',
  'deep-autumn': 'neutral',
  'deep-winter': 'neutral',
  'bright-winter': 'neutral',
}

export type ToneVariant = {
  name: string
  image: string
  credit: string
}

export const TONE_VARIANTS: Record<SkinToneGroup, ToneVariant[]> = {
  cool: [
    { name: 'Tone hồng lạnh', image: '/personal-color/recommendations/tone/cool-pink.png', credit: 'Feyede Maya, Elegant, LitiTwirl/pinterest.com' },
    { name: 'Tone đỏ lạnh', image: '/personal-color/recommendations/tone/cool-red.png', credit: 'Minji, Eleena, Nal/pinterest.com' },
    { name: 'Tone berry lạnh', image: '/personal-color/recommendations/tone/cool-berry.png', credit: 'Bell, PUB-X, Eleena/pinterest.com' },
    { name: 'Tone tím lạnh', image: '/personal-color/recommendations/tone/cool-purple.png', credit: 'Ghdry, thalia, Rinne/pinterest.com' },
    { name: 'Tone xám khói lạnh', image: '/personal-color/recommendations/tone/cool-smoky-gray.png', credit: 'Bell, Linn, han/pinterest.com' },
    { name: 'Tone nâu lạnh', image: '/personal-color/recommendations/tone/cool-brown.png', credit: 'SHERLAU Official, ken, claire/pinterest.com' },
  ],
  warm: [
    { name: 'Tone cam đào', image: '/personal-color/recommendations/tone/warm-peach.png', credit: 'Zeliana Treveth, Jojo, naunniexx/pinterest.com' },
    { name: 'Tone cam đất', image: '/personal-color/recommendations/tone/warm-terracotta.png', credit: 'trashysm, Jhea, 제니퍼/pinterest.com' },
    { name: 'Tone hồng san hô', image: '/personal-color/recommendations/tone/warm-coral.png', credit: 'Do Yen, vasni, Phan Diễm/pinterest.com' },
    { name: 'Tone hồng đất', image: '/personal-color/recommendations/tone/warm-earthy-pink.png', credit: 'Phan Diễm/pinterest.com' },
    { name: 'Tone đỏ gạch', image: '/personal-color/recommendations/tone/warm-brick-red.png', credit: 'Minji, Tiểu Bối, shuiixynk/pinterest.com' },
  ],
  neutral: [
    { name: 'Tone hồng trung tính', image: '/personal-color/recommendations/tone/neutral-pink.png', credit: 'lowsat_/instagram.com' },
    { name: 'Tone cam trung tính', image: '/personal-color/recommendations/tone/neutral-orange.png', credit: '豌豆公主, Hương Tràm Singer, Lily/pinterest.com' },
    { name: 'Tone nâu mocha', image: '/personal-color/recommendations/tone/neutral-mocha.png', credit: 'Beauty Breeze, Chans big feet, nav/pinterest.com' },
    { name: 'Tone caramel trong suốt', image: '/personal-color/recommendations/tone/neutral-caramel.png', credit: 'Rinne, Ivory, naunniexx/pinterest.com' },
  ],
}
