'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import OutfitStepper from '@/components/outfit/OutfitStepper'
import FlowOverviewBanner from '@/components/outfit/FlowOverviewBanner'
import GarmentDropzone from '@/components/outfit/step1/GarmentDropzone'
import ProductUrlFetcher from '@/components/outfit/step1/ProductUrlFetcher'
import ColorHarmonyCard from '@/components/outfit/step1/ColorHarmonyCard'
import RecentGarments from '@/components/outfit/step1/RecentGarments'

const MODE_TABS = [
  { id: 'single', icon: 'checkroom', label: 'Quần áo đơn lẻ' },
  { id: 'set', icon: 'layers', label: 'Set đồ (Trên & Dưới)' },
] as const

export default function Step1Page() {
  const router = useRouter()
  const [activeMode, setActiveMode] = useState<(typeof MODE_TABS)[number]['id']>('single')
  const [isContinuing, setIsContinuing] = useState(false)

  function handleContinue() {
    setIsContinuing(true)
    setTimeout(() => {
      router.push('/outfit/step-2')
    }, 700)
  }

  return (
    <div className="flex w-full flex-col pb-space-xl">
      <OutfitStepper currentStep={1} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-space-lg px-margin-desktop pt-space-md">
        <div className="pt-space-lg">
          <FlowOverviewBanner
            title="Lộ trình thử đồ thông minh cá nhân hóa"
            subtitle="Hệ thống phân tách bóc phông chuẩn Studio, hỗ trợ link sàn Shopee, Zara, TikTok Shop"
            image="/outfit/flow-overview.png"
            imageAlt="Quy trình thử đồ ảo TwistFit 4 bước"
          />
        </div>
        <div className="flex flex-col justify-between gap-space-md pb-space-xs md:flex-row md:items-end">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-label-sm font-semibold uppercase tracking-widest text-on-primary">
                Step 01 / 04
              </span>
              <span className="text-label-md font-semibold italic text-secondary">A little twist, a better fit</span>
            </div>
            <h1 className="text-headline-lg font-bold tracking-tight text-on-surface">
              Tải lên hoặc Chọn Trang Phục Cần Thử
            </h1>
            <p className="max-w-2xl text-body-md text-on-surface-variant">
              Sử dụng ảnh flat-lay, ảnh treo móc đồ hoặc dán trực tiếp đường dẫn sản phẩm online. Thuật toán AI
              Vision tự động xóa nền phức tạp và giữ nguyên nếp vải thực tế.
            </p>
          </div>
          <div className="inline-flex shrink-0 self-start rounded-2xl bg-surface-container-high p-1 shadow-inner md:self-auto">
            {MODE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className={`flex items-center gap-space-xs rounded-xl px-space-md py-space-sm text-label-lg transition-all ${
                  activeMode === tab.id
                    ? 'bg-surface-container-lowest font-semibold text-on-surface shadow-sm'
                    : 'font-medium text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-7">
            <GarmentDropzone />
            <ProductUrlFetcher />
          </div>
          <div className="flex flex-col gap-space-md lg:col-span-5">
            <ColorHarmonyCard />
            <RecentGarments />
          </div>
        </div>
        <div className="mt-space-md flex flex-col items-center justify-between gap-space-md pt-space-lg sm:flex-row">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-space-xs rounded-2xl bg-surface-container-low px-space-lg py-space-md font-semibold text-label-lg text-on-surface transition-all hover:bg-surface-container sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Quay lại trang chủ</span>
          </Link>
          <div className="flex w-full items-center gap-space-md sm:w-auto">
            <span className="hidden text-body-sm text-outline md:inline">
              Đã lưu trang phục tự động vào phiên thử
            </span>
            <button
              type="button"
              onClick={handleContinue}
              className="flex w-full items-center justify-center gap-space-sm rounded-2xl bg-primary px-space-xl py-space-md font-bold text-headline-sm text-on-primary shadow-lg shadow-primary/25 transition-all hover:bg-primary-container hover:shadow-xl sm:w-auto"
            >
              <span>{isContinuing ? 'Đang chuyển dữ liệu...' : 'Tiếp tục sang Bước 2: Chọn Người Mẫu'}</span>
              <span className="material-symbols-outlined text-[22px]">
                {isContinuing ? 'hourglass_top' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
