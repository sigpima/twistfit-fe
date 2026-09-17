const IMAGE_NUMBERS = [
  2852, 2853, 2854, 2856, 2857, 2858, 2859, 2860, 2861, 2862, 2863, 2864,
  2865, 2866, 2867, 2868, 2869, 2870, 2871, 2872, 2874, 2875, 2876, 2877,
  2880, 2881, 2882, 2883, 2884, 2885, 2887, 2888, 2889,
] as const

export type HeroSlideshowImage = {
  src: string
  alt: string
}

export const HERO_SLIDESHOW_MOBILE_IMAGES: HeroSlideshowImage[] = IMAGE_NUMBERS.map((number) => ({
  src: `/home/hero-slideshow/mobile/img-${number}.jpg`,
  alt: '',
}))

export const HERO_SLIDESHOW_DESKTOP_IMAGES: HeroSlideshowImage[] = IMAGE_NUMBERS.map((number) => ({
  src: `/home/hero-slideshow/desktop/img-${number}.jpg`,
  alt: '',
}))

export const HERO_SLIDESHOW_DESKTOP_WIDE_IMAGES: HeroSlideshowImage[] = IMAGE_NUMBERS.map((number) => ({
  src: `/home/hero-slideshow/desktop-wide/img-${number}.jpg`,
  alt: '',
}))
