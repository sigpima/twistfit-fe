'use client'

import { useTranslations } from 'next-intl'
import { useState, type ChangeEvent } from 'react'
import { useOutfitFlow } from '../OutfitFlowProvider'

export default function GarmentDropzone() {
  const t = useTranslations('Outfit.Step1.GarmentDropzone')
  const { selectedGarment } = useOutfitFlow()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isBackgroundRemovalOn, setIsBackgroundRemovalOn] = useState(true)
  const [isUltraHdOn, setIsUltraHdOn] = useState(true)

  const displayedImage = uploadedImage ?? selectedGarment.image

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadedImage(URL.createObjectURL(file))
  }

  return (
    <div className="relative flex min-h-[460px] flex-col items-center justify-between overflow-hidden rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex w-full items-center justify-between pb-space-md">
        <div className="flex items-center gap-space-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
          <span className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            {t('liveCanvasLabel')}
          </span>
        </div>
        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            title={t('zoomTitle')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">zoom_in</span>
          </button>
          <button
            type="button"
            title={t('rotateTitle')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[16px]">rotate_right</span>
          </button>
          <button
            type="button"
            title={t('resetTitle')}
            onClick={() => setUploadedImage(null)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition-colors hover:bg-error-container hover:text-on-error-container"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
      <div className="group relative flex w-full flex-1 flex-col items-center justify-center rounded-2xl bg-surface-container-low/40 p-space-md shadow-inner">
        <div className="relative flex h-72 w-64 items-center justify-center md:h-80 md:w-72">
          <div className="absolute inset-0 -z-0 scale-90 transform rounded-full bg-secondary-fixed/40 blur-2xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayedImage}
            alt={selectedGarment.name}
            className="relative z-10 max-h-full max-w-full object-contain drop-shadow-[0_12px_24px_rgba(123,81,109,0.18)] transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1.5 rounded-full bg-surface-container-lowest/90 px-3 py-1 text-label-sm font-semibold text-primary shadow-md backdrop-blur-md">
            <span className="material-symbols-outlined text-[15px] text-secondary">check_circle</span>
            <span>{t('bgRemovedBadge')}</span>
          </div>
        </div>
        <div className="mt-space-sm text-center">
          <h3 className="text-headline-sm font-semibold text-on-surface">{selectedGarment.name}</h3>
          <p className="text-body-sm text-on-surface-variant">{t('catalogNote')}</p>
        </div>
        <label
          htmlFor="garmentUploadInput"
          className="absolute inset-x-4 inset-y-4 z-30 flex cursor-pointer flex-col items-center justify-center rounded-xl bg-surface-container-lowest/95 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100"
        >
          <div className="mb-space-sm flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed shadow-md transition-transform group-hover:scale-110">
            <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
          </div>
          <span className="text-headline-sm font-semibold text-on-surface">{t('dragDropTitle')}</span>
          <span className="mt-1 text-body-sm text-on-surface-variant">{t('supportedFormats')}</span>
          <span className="mt-space-md rounded-full bg-primary px-space-md py-1.5 text-label-sm font-medium text-on-primary">
            {t('uploadFromDevice')}
          </span>
        </label>
        <input
          id="garmentUploadInput"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-space-sm pt-space-md">
        <label className="flex cursor-pointer select-none items-center gap-space-xs">
          <input
            type="checkbox"
            checked={isBackgroundRemovalOn}
            onChange={(event) => setIsBackgroundRemovalOn(event.target.checked)}
            aria-label={t('bgRemovalToggleLabel')}
          />
          <span className="text-label-md font-medium text-on-surface">{t('bgRemovalToggleLabel')}</span>
        </label>
        <label className="flex cursor-pointer select-none items-center gap-space-xs">
          <input
            type="checkbox"
            checked={isUltraHdOn}
            onChange={(event) => setIsUltraHdOn(event.target.checked)}
            aria-label={t('ultraHdToggleLabel')}
          />
          <span className="text-label-md font-medium text-on-surface">{t('ultraHdToggleLabel')}</span>
        </label>
      </div>
    </div>
  )
}
