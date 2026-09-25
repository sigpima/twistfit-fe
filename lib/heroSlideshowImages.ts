const IMAGE_NUMBERS = [
  2852, 2853, 2854, 2856, 2857, 2858, 2859, 2860, 2861, 2862, 2863, 2864,
  2866, 2869, 2870, 2871, 2872, 2874, 2875, 2876, 2877,
  2880, 2881, 2882, 2883, 2884, 2885, 2887, 2888, 2889,
] as const

export type HeroSlideshowImage = {
  src: string
  webpSrc: string
  alt: string
}

function buildImageSet(directory: string): HeroSlideshowImage[] {
  return IMAGE_NUMBERS.map((number) => ({
    src: `/home/hero-slideshow/${directory}/img-${number}.jpg`,
    webpSrc: `/home/hero-slideshow/${directory}/img-${number}.webp`,
    alt: '',
  }))
}

export const HERO_SLIDESHOW_MOBILE_IMAGES: HeroSlideshowImage[] = buildImageSet('mobile')

export const HERO_SLIDESHOW_DESKTOP_IMAGES: HeroSlideshowImage[] = buildImageSet('desktop')

export const HERO_SLIDESHOW_DESKTOP_WIDE_IMAGES: HeroSlideshowImage[] = buildImageSet('desktop-wide')
