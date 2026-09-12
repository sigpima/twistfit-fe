'use client'

import { useQrModal } from '@/components/qr-modal/QrModalProvider'

const PALETTE_SWATCHES = [
  '#1B365D',
  '#2E5B88',
  '#4C5A88',
  '#7B516D',
  '#9F2B68',
  '#C2185B',
  '#004D40',
  '#00695C',
  '#D4E3FF',
  '#FDC8E9',
  '#E0E0E0',
  '#1C314D',
]

export default function Hero() {
  const { openQrModal } = useQrModal()

  return (
    <section className="relative mx-auto w-full max-w-7xl px-margin-desktop py-space-xl lg:py-24">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="flex flex-col items-start space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container-high px-4 py-1.5 text-label-md text-primary shadow-sm backdrop-blur-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/icon-mark.png" alt="Icon TwistFit" className="h-5 w-5 object-contain" />
            <span>Phiên bản nâng cấp TwistFit AI 2026</span>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          </div>
          <h1 className="text-display-lg tracking-tight text-on-surface">
            Khám Phá Bản Sắc Riêng Cùng{' '}
            <span className="text-primary underline decoration-secondary-container decoration-wavy decoration-2">
              Personal Color
            </span>{' '}
            &amp; Phối Đồ Thông Minh
          </h1>
          <p className="max-w-2xl text-body-lg text-on-surface-variant">
            Mỗi người là một bảng màu độc bản. TwistFit giúp bạn thấu hiểu sắc độ của chính mình, mở khóa
            phong cách ăn mặc thời thượng và tự tin tỏa sáng mỗi ngày.
          </p>
          <div className="flex w-full flex-wrap items-center gap-space-md pt-2 sm:w-auto">
            <button
              type="button"
              onClick={openQrModal}
              className="flex flex-1 transform items-center justify-center gap-space-sm rounded-full bg-primary px-7 py-3.5 text-label-lg text-on-primary shadow-[0_8px_20px_rgba(76,90,136,0.25)] transition-all hover:-translate-y-0.5 hover:bg-primary-container sm:flex-none"
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              <span>Kiểm Tra Màu Sắc (Camera QR)</span>
            </button>
            <a
              href="#features-section"
              className="flex flex-1 items-center justify-center gap-space-sm rounded-full bg-surface-container px-7 py-3.5 text-label-lg text-on-surface transition-all hover:bg-surface-container-high sm:flex-none"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">checkroom</span>
              <span>Bắt Đầu Phối Đồ Ngay</span>
            </a>
          </div>
          <div className="flex items-center gap-8 pt-6 text-on-surface-variant">
            <div className="flex -space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-label-md font-bold text-primary shadow-sm">
                LĐ
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-fixed text-label-md font-bold text-secondary shadow-sm">
                MN
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed text-label-md font-bold text-tertiary shadow-sm">
                TH
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-label-sm font-bold text-primary shadow-sm">
                +98k
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[#eab308]">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star_half
                </span>
                <span className="ml-1 text-label-md font-bold text-on-surface">4.9/5</span>
              </div>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">Hơn 120.000 lượt phân tích màu sắc chuẩn xác</p>
            </div>
          </div>
        </div>
        <div className="relative flex items-center justify-center lg:col-span-5">
          <div className="relative w-full max-w-[340px] rounded-[44px] bg-surface-container-lowest p-3.5 shadow-[0_24px_50px_rgba(4,28,55,0.12)]">
            <div className="absolute left-1/2 top-6 z-30 h-4.5 w-28 -translate-x-1/2 rounded-full bg-on-surface" />
            <div className="flex w-full flex-col overflow-hidden rounded-[34px] bg-surface-container-low px-4 pb-4 pt-8">
              <div className="mb-2 flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary-container">
                    <span className="material-symbols-outlined text-[16px] text-secondary">palette</span>
                  </div>
                  <div>
                    <p className="text-label-sm font-bold text-on-surface">Kết Quả Personal Color</p>
                    <p className="text-[10px] text-on-surface-variant">Nhận diện bằng AI Camera</p>
                  </div>
                </div>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Cold Tone
                </span>
              </div>
              <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-surface-container shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/home/hero-model-winter.png"
                  alt="Chân dung minh hoạ kết quả Personal Color mùa Đông"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-xl bg-surface-container-lowest/80 p-2 backdrop-blur-md">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Mùa Phù Hợp</span>
                    <p className="text-[16px] font-bold leading-tight text-on-surface">Mùa Đông (Winter)</p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed text-primary">
                    <span className="material-symbols-outlined text-[16px]">ac_unit</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-label-sm font-semibold text-on-surface">Bảng màu tôn da nhất</span>
                  <span className="text-[10px] font-bold text-primary">12 sắc thái</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {PALETTE_SWATCHES.map((hex) => (
                    <div key={hex} className="h-6 rounded-md shadow-xs" style={{ backgroundColor: hex }} />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex-1 rounded-xl bg-surface-container-lowest p-2 text-center">
                  <span className="material-symbols-outlined text-[18px] text-primary">checkroom</span>
                  <p className="text-[10px] font-medium text-on-surface">Đầm Dạ Hội</p>
                </div>
                <div className="flex-1 rounded-xl bg-surface-container-lowest p-2 text-center">
                  <span className="material-symbols-outlined text-[18px] text-secondary">brush</span>
                  <p className="text-[10px] font-medium text-on-surface">Son Berry Cold</p>
                </div>
                <div className="flex-1 rounded-xl bg-surface-container-lowest p-2 text-center">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">diamond</span>
                  <p className="text-[10px] font-medium text-on-surface">Bạc Platinum</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-6 flex items-center gap-3 rounded-2xl bg-surface-container-lowest/90 p-3.5 shadow-[0_12px_28px_rgba(4,28,55,0.08)] backdrop-blur-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-fixed">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <p className="text-label-sm font-bold text-on-surface">Độ chính xác 98.4%</p>
              <p className="text-body-sm text-on-surface-variant">Phân giải sắc tố da 3D</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
