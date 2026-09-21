'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

type ImageLightboxProps = {
  src: string
  alt: string
  onClose: () => void
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const t = useTranslations('ImageLightbox')

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      data-testid="image-lightbox-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/70 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative max-h-full max-w-full">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('closeAriaLabel')}
          className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-lg transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
      </div>
    </div>
  )
}
