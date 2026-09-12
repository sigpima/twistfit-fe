'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import OutfitStepper from '@/components/outfit/OutfitStepper'
import SelectedGarmentBanner from '@/components/outfit/step2/SelectedGarmentBanner'
import ModelCatalog from '@/components/outfit/step2/ModelCatalog'
import ModelDossier from '@/components/outfit/step2/ModelDossier'

const MODE_TABS = [
  { id: 'our-models', icon: 'group', label: 'Mẫu của chúng tôi (TwistFit AI)', badge: '18 Sẵn có' },
  { id: 'user-model', icon: 'add_a_photo', label: 'Mẫu của bạn (Tải ảnh cá nhân)', badge: 'Chính chủ' },
] as const

export default function Step2Page() {
  const router = useRouter()
  const [activeMode, setActiveMode] = useState<(typeof MODE_TABS)[number]['id']>('our-models')
  const [isContinuing, setIsContinuing] = useState(false)

  function handleContinue() {
    setIsContinuing(true)
    setTimeout(() => {
      router.push('/outfit/step-3')
    }, 700)
  }

  return (
    <div className="flex w-full flex-col">
      <OutfitStepper currentStep={2} />
      <section className="w-full bg-surface-container-low px-margin-desktop py-space-lg">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-space-md lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-space-xs text-label-md font-semibold uppercase tracking-wider text-secondary">
              <span className="material-symbols-outlined text-[18px]">face_retouching_natural</span>
              Cá nhân hoá hình tượng
            </div>
            <h1 className="mt-1 text-headline-lg tracking-tight text-on-surface">
              Bước 2: Chọn Người Mẫu Hoặc Tải Ảnh Cá Nhân
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              Lựa chọn vóc dáng và thần thái phù hợp nhất để công nghệ AI render trang phục chuẩn xác theo tỷ lệ
              cơ thể thực tế.
            </p>
          </div>
          <SelectedGarmentBanner />
        </div>
      </section>
      <section className="w-full bg-background px-margin-desktop py-space-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-gutter-desktop lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-8">
            <div className="flex items-center gap-space-xs rounded-2xl bg-surface-container p-1.5">
              {MODE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMode(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-space-sm rounded-xl px-space-md py-3 text-title-md transition-all ${
                    activeMode === tab.id
                      ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm'
                      : 'font-medium text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-label-sm text-on-primary-fixed">
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>
            <ModelCatalog />
          </div>
          <div className="lg:col-span-4">
            <ModelDossier />
          </div>
        </div>
      </section>
      <section className="sticky bottom-0 z-40 w-full bg-surface-container-lowest/95 px-margin-desktop py-space-md shadow-xl backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-space-md sm:flex-row">
          <Link
            href="/outfit/step-1"
            className="flex w-full items-center justify-center gap-space-xs rounded-full bg-surface-container-high px-space-lg py-3 text-label-lg text-on-surface transition-colors hover:bg-surface-container-highest sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại Bước 1 (Chọn đồ)
          </Link>
          <button
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-space-sm rounded-full bg-primary px-space-xl py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg sm:w-auto"
          >
            <span>
              {isContinuing ? 'Đang chuyển dữ liệu...' : 'Xác nhận người mẫu & Tiếp tục sang Bước 3'}
            </span>
            <span className="material-symbols-outlined text-[20px]">
              {isContinuing ? 'hourglass_top' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}
