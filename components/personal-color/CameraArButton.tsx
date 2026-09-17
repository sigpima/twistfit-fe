'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import QRCode from 'react-qr-code'
import { isMobileDevice } from '@/lib/isMobileDevice'
import type { SubSeason } from '@/lib/db'
import { subSeasonToPaletteId } from '@/lib/subSeasonToPaletteId'

export default function CameraArButton({ subSeason }: { subSeason: SubSeason }) {
  const t = useTranslations('PersonalColor.Result.CameraArButton')
  const router = useRouter()
  const [isQrOpen, setIsQrOpen] = useState(false)
  const cameraFramePath = `/camera-frame?palette=${subSeasonToPaletteId(subSeason)}`

  function handleClick() {
    if (isMobileDevice(window.navigator.userAgent)) {
      router.push(cameraFramePath)
      return
    }
    setIsQrOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center justify-center gap-2 rounded-2xl border border-[#7b89ba]/30 bg-white px-4 py-3 text-xs font-semibold text-[#304461] transition-all hover:border-[#7b89ba] hover:bg-[#eef4fa] sm:w-auto"
      >
        <span className="material-symbols-outlined text-[16px] text-primary">photo_camera</span>
        <span>{t('openButton')}</span>
      </button>
      {isQrOpen && (
        <div
          data-testid="camera-ar-qr-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsQrOpen(false)
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl bg-surface-container-lowest p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsQrOpen(false)}
              aria-label={t('closeAriaLabel')}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-secondary">
                <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
              </div>
              <h3 className="text-headline-sm font-bold text-on-surface">{t('modalTitle')}</h3>
              <p className="mt-2 max-w-xs text-body-md text-on-surface-variant">{t('modalDescription')}</p>
              <div className="mt-6 rounded-2xl bg-surface-container-low p-4 shadow-inner">
                <QRCode value={`${window.location.origin}${cameraFramePath}`} size={192} title={t('qrTitle')} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
