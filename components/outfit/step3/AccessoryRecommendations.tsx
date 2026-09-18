'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '../OutfitFlowProvider'

type Accessory = {
  id: number
  name: string
  imageUrl: string
  affiliateLink: string
  category: string
}

export default function AccessoryRecommendations() {
  const t = useTranslations('Outfit.Step3.AccessoryRecommendations')
  const { occasionStyleMode, selectedOccasion, selectedStyle } = useOutfitFlow()
  const [accessories, setAccessories] = useState<Accessory[]>([])

  useEffect(() => {
    let cancelled = false

    const params =
      occasionStyleMode === 'occasion'
        ? `occasion=${encodeURIComponent(selectedOccasion)}`
        : `style=${encodeURIComponent(selectedStyle)}`

    apiFetch(`/accessories/recommendations?${params}`)
      .then(async (response) => {
        if (cancelled || !response.ok) return
        setAccessories((await response.json()) as Accessory[])
      })
      .catch(() => {
        if (!cancelled) setAccessories([])
      })

    return () => {
      cancelled = true
    }
  }, [occasionStyleMode, selectedOccasion, selectedStyle])

  if (accessories.length === 0) return null

  return (
    <section
      aria-labelledby="accessory-recommendations-heading"
      className="flex flex-col gap-space-sm lg:col-span-5 lg:self-end"
    >
      <h2 id="accessory-recommendations-heading" className="text-label-lg font-bold text-on-surface">
        {t('heading')}
      </h2>
      <div className="flex snap-x snap-mandatory gap-space-sm overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {accessories.map((accessory) => (
          <div
            key={accessory.id}
            className="flex w-40 flex-shrink-0 snap-start flex-col gap-2 rounded-2xl bg-surface-container-lowest p-3 shadow-sm lg:w-full lg:flex-row lg:items-center lg:gap-3"
          >
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-surface-container lg:w-16 lg:flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={accessory.imageUrl} alt={accessory.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <span className="line-clamp-2 text-label-md font-semibold text-on-surface">{accessory.name}</span>
              <a
                href={accessory.affiliateLink}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-label={t('buyNowAriaLabel', { name: accessory.name })}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-4 text-label-sm font-semibold text-on-primary"
              >
                {t('buyNowButton')}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
