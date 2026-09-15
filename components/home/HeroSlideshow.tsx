'use client'

import { useEffect, useState } from 'react'

export type HeroSlideshowImage = {
  src: string
  alt: string
}

type HeroSlideshowProps = {
  images: HeroSlideshowImage[]
  className?: string
}

const INTERVAL_MS = 5000

export default function HeroSlideshow({ images, className }: HeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, INTERVAL_MS)
    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} aria-hidden="true">
      {images.map((image, index) => (
        <img
          key={image.src}
          src={image.src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  )
}
