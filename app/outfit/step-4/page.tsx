'use client'

import { useRouter } from 'next/navigation'
import { useOutfitFlow } from '@/components/outfit/OutfitFlowProvider'
import ResultPreview from '@/components/outfit/step4/ResultPreview'
import ResultActionsPanel from '@/components/outfit/step4/ResultActionsPanel'
import GarmentSummaryPanel from '@/components/outfit/step4/GarmentSummaryPanel'
import CapsuleWardrobe from '@/components/outfit/step4/CapsuleWardrobe'

export default function Step4Page() {
  const router = useRouter()
  const { selectedModel } = useOutfitFlow()

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-gradient-to-b from-surface-container-high/40 via-background to-surface-container-low/60 pb-space-xl">
        <div className="mx-auto max-w-7xl px-margin pt-space-lg md:px-margin-desktop">
          <div className="mb-space-lg flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
            <div>
              <div className="mb-space-xs inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed px-space-sm py-1 text-label-sm text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                Khởi tạo hoàn tất với công nghệ TwistFit AI Physics™
              </div>
              <h1 className="text-headline-lg tracking-tight text-on-surface">Kết Quả Thử Đồ Ảo AI FitRoom HD</h1>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Mô phỏng phom dáng thực tế cho người mẫu <strong>{selectedModel.name}</strong> kết hợp phân
                tích tương thích sắc tố cá nhân.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-space-sm">
              <a
                href="#capsule-wardrobe"
                className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest px-space-md py-space-sm text-label-md text-on-surface shadow-sm transition-all hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">style</span>
                Gợi ý Capsule Phối Đồ
              </a>
              <button
                type="button"
                onClick={() => router.push('/outfit/step-1')}
                className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-high px-space-md py-space-sm text-label-md text-on-surface-variant transition-all hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Làm Mới
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ResultPreview />
            </div>
            <div className="flex flex-col gap-space-md lg:col-span-5">
              <ResultActionsPanel />
              <GarmentSummaryPanel />
            </div>
          </div>
        </div>
      </section>
      <CapsuleWardrobe />
    </div>
  )
}
