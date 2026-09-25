'use client'

import { useEffect, useState } from 'react'

export type HeroSlideshowImage = {
  src: string
  webpSrc: string
  alt: string
}

type HeroSlideshowProps = {
  images: HeroSlideshowImage[]
  className?: string
}

const INTERVAL_MS = 5000
// Keep one slide preloaded ahead of the one on screen so the crossfade never
// shows a blank frame, without fetching every remaining slide up front.
const PRELOAD_AHEAD = 2

export default function HeroSlideshow({ images, className }: HeroSlideshowProps) {
  // `step` only ever increases, unlike `step % images.length`, so the set of
  // mounted slides (derived from it below) never shrinks and re-triggers a
  // network request for a slide the user has already seen.
  const [step, setStep] = useState(0)
  const activeIndex = images.length > 0 ? step % images.length : 0
  const mountedCount = Math.min(step + PRELOAD_AHEAD, images.length)

  useEffect(() => {
    if (images.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const interval = setInterval(() => {
      setStep((current) => current + 1)
    }, INTERVAL_MS)
    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} aria-hidden="true">
      {images.slice(0, mountedCount).map((image, index) => (
        // Plain <picture>/<img> rather than next/image: these files are
        // pre-optimized (see scripts/optimize-hero-images.mjs) and served
        // unmodified, so next/image's runtime resize/format pipeline (which
        // also 400s on this app's production host — see git history) has
        // nothing to add here.
        <picture key={image.src}>
          <source srcSet={image.webpSrc} type="image/webp" />
          <img
            src={image.src}
            alt=""
            fetchPriority={index === 0 ? 'high' : undefined}
            loading={index === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </picture>
      ))}
    </div>
  )
}
