'use client'

import { useState } from 'react'
import { useOutfitFlow } from '../OutfitFlowProvider'

export default function ResultPreview() {
  const { selectedModel, selectedGarment } = useOutfitFlow()
  const [isZoomed, setIsZoomed] = useState(false)
  const [rotationStatus, setRotationStatus] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-space-md">
      <div className="group relative w-full overflow-hidden rounded-2xl bg-surface-container-lowest shadow-xl">
        <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-inverse-surface/85 px-3 py-1 text-label-sm text-inverse-on-surface shadow-md backdrop-blur-md">
            <span className="h-2 w-2 animate-ping rounded-full bg-secondary" />
            FitRoom Studio HD
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-lowest/90 px-3 py-1 text-label-sm font-semibold text-primary shadow-sm backdrop-blur-md">
            <span className="material-symbols-outlined text-[15px]">motion_sensor_active</span>
            TwistFit AI Physics 2.4
          </span>
        </div>
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5">
          <button
            type="button"
            title="Phóng to"
            onClick={() => setIsZoomed((zoomed) => !zoomed)}
            className={`flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all ${
              isZoomed ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest/90 text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">zoom_in</span>
          </button>
          <button
            type="button"
            title="Góc xoay 360"
            onClick={() => setRotationStatus('Đang tải mô hình không gian xoay 360 độ TwistFit AI...')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface shadow-sm backdrop-blur-md transition-all hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">360</span>
          </button>
        </div>
        <div className="relative flex min-h-[520px] w-full flex-col items-center justify-center overflow-hidden bg-surface-container-low p-space-sm md:p-space-md">
          <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-surface-container shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/outfit/flow-overview.png"
              alt={`Kết quả thử đồ ảo cho người mẫu ${selectedModel.name}`}
              style={{ transform: isZoomed ? 'scale(1.35)' : 'scale(1)' }}
              className="h-auto w-full object-cover object-right transition-transform duration-500"
            />
            <div className="absolute bottom-3 right-3 rounded-md bg-inverse-surface/80 px-2.5 py-1 text-label-sm text-inverse-on-surface backdrop-blur-sm">
              Cột 4: Render Hoàn Chỉnh HD
            </div>
          </div>
          {rotationStatus && (
            <p className="mt-space-sm text-label-sm text-on-surface-variant">{rotationStatus}</p>
          )}
          <div className="mt-space-sm flex w-full items-center justify-between px-space-xs text-on-surface-variant">
            <span className="flex items-center gap-1 text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-primary">person</span>
              Người mẫu: <strong>{selectedModel.name} ({selectedModel.height})</strong>
            </span>
            <span className="flex items-center gap-1 text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">palette</span>
              Mã màu đồ: <strong>{selectedGarment.tone}</strong>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-fixed-dim" />
            <span className="text-body-sm text-on-surface-variant">Chiết eo Peplum tôn dáng đồng hồ cát</span>
          </div>
          <div className="flex items-center gap-space-sm text-on-surface-variant">
            <button type="button" className="flex items-center gap-1 text-label-sm transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">share</span> Chia sẻ
            </button>
            <span className="text-outline-variant">•</span>
            <button type="button" className="flex items-center gap-1 text-label-sm transition-colors hover:text-primary">
              <span className="material-symbols-outlined text-[18px]">fullscreen</span> Toàn màn hình
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-xl bg-gradient-to-r from-surface-container-high/60 via-surface-container-low to-secondary-fixed/30 p-space-md shadow-sm">
        <div className="flex items-start gap-space-sm">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
            <span className="material-symbols-outlined text-[22px]">psychology</span>
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1 text-label-md font-bold uppercase tracking-wider text-primary">
                ✨ Đánh Giá Cá Nhân Hoá AI Personal Color
              </span>
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-label-sm font-semibold text-on-secondary-container">
                Độ Hợp: 96% (Rất Hợp)
              </span>
            </div>
            <p className="text-body-md leading-relaxed text-on-surface">
              Phân loại sắc thái: <strong>Summer Soft (Mùa Hè Dịu)</strong>. Sắc hồng phấn pastel tạo độ cân
              bằng quang học làm bật tone da mặt thêm <strong>15%</strong>. Cấu trúc peplum thắt eo tự nhiên
              giải quyết triệt để khuyết điểm phần hông, mang lại tỉ lệ vóc dáng cân đối và thanh thoát.
            </p>
            <div className="mt-space-sm flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-surface-container-lowest px-2.5 py-1 text-label-sm text-on-surface-variant">
                Tone da: Sáng lạnh (Cool-undertone)
              </span>
              <span className="rounded-md bg-surface-container-lowest px-2.5 py-1 text-label-sm text-on-surface-variant">
                Độ tương phản: Trung bình dịu
              </span>
              <span className="rounded-md bg-surface-container-lowest px-2.5 py-1 text-label-sm text-on-surface-variant">
                Tỷ lệ vai/hông: Chuẩn 0.72
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
