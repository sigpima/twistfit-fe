'use client'

import { useRouter } from 'next/navigation'
import FlowOverviewBanner from '@/components/outfit/FlowOverviewBanner'
import QuickSelectionSummary from '@/components/outfit/step3/QuickSelectionSummary'
import PoseSelector from '@/components/outfit/step3/PoseSelector'
import RenderSettings from '@/components/outfit/step3/RenderSettings'
import BodyMeasurements from '@/components/outfit/step3/BodyMeasurements'

export default function Step3Page() {
  const router = useRouter()

  function handleGenerate() {
    router.push('/outfit/step-4')
  }

  return (
    <div className="flex w-full flex-col pb-space-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-lg px-margin-desktop pt-space-lg">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="rounded-full bg-secondary-fixed px-2.5 py-0.5 text-label-sm font-semibold uppercase text-on-secondary-fixed">
                Virtual Dressing Studio
              </span>
              <span className="text-outline-variant">•</span>
              <span className="text-label-sm text-outline">Smart Fit Engine 3.2</span>
            </div>
            <h1 className="text-headline-lg text-on-surface">
              Bước 3: Chọn Tư Thế &amp; Điều Chỉnh Tỷ Lệ Vóc Dáng
            </h1>
            <p className="text-body-md text-on-surface-variant">
              Tinh chỉnh tư thế người mẫu và số đo cơ thể để công nghệ AI render chính xác từng nếp vải.
            </p>
          </div>
          <QuickSelectionSummary />
        </div>
        <FlowOverviewBanner
          title="Quy trình thiết lập trực quan 3 bước TwistFit Studio"
          subtitle="Đồng bộ hoá tự động với dữ liệu Personal Color của bạn"
          image="/outfit/flow-overview-step3.png"
          imageAlt="Tiến trình phòng thử đồ TwistFit"
        />
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-7">
            <PoseSelector />
            <RenderSettings />
          </div>
          <div className="lg:col-span-5">
            <div className="flex flex-col gap-space-md">
              <BodyMeasurements />
              <div className="flex flex-col gap-space-sm">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="group flex w-full transform items-center justify-center gap-space-sm rounded-full bg-gradient-to-r from-secondary via-primary-container to-primary px-space-lg py-space-md text-headline-sm text-on-primary shadow-xl transition-all hover:shadow-2xl active:scale-98"
                >
                  <span className="material-symbols-outlined text-[26px] transition-transform group-hover:rotate-12">
                    bolt
                  </span>
                  <span>⚡ Tạo Đồ Ảo Ngay (Nhanh - 1 credit)</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/outfit/step-2')}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-surface-container px-space-md py-space-sm text-label-lg text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Quay lại Bước 2</span>
                </button>
                <div className="flex items-center justify-center gap-2 text-label-sm text-outline">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>Thời gian xử lý AI ước tính: ~4 giây</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container-low/70 p-space-lg md:flex-row">
          <div className="flex items-center gap-space-md">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container shadow-sm">
              <span className="material-symbols-outlined text-[32px]">tips_and_updates</span>
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm text-on-surface">Mẹo nhỏ tạo dáng cho Áo Peplum</span>
              <p className="max-w-2xl text-body-md text-on-surface-variant">
                Tư thế &quot;Đứng thẳng phía trước&quot; và &quot;Góc 45 độ&quot; là 2 lựa chọn hàng đầu của
                stylist TwistFit giúp thấy rõ độ chuyển động của vạt áo và eo thon.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-space-sm">
            <span className="text-label-lg font-semibold text-primary">Tài khoản còn: 12 Credits</span>
            <button
              type="button"
              className="rounded-full bg-primary-fixed px-space-md py-space-xs text-label-md font-semibold text-on-primary-fixed transition-all hover:bg-primary hover:text-on-primary"
            >
              Nạp thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
