'use client'

import { useState } from 'react'
import { useOutfitFlow } from '../OutfitFlowProvider'

export default function ModelDossier() {
  const { selectedModel } = useOutfitFlow()
  const [isHdOn, setIsHdOn] = useState(true)

  return (
    <div className="sticky top-24 flex flex-col gap-space-md rounded-3xl bg-surface-container-lowest p-space-md shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-headline-sm text-on-surface">Hồ sơ người mẫu</span>
        <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-label-sm font-semibold text-on-primary-fixed">
          Đã khớp 98% dáng áo
        </span>
      </div>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface-container shadow-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selectedModel.dossierImage} alt={selectedModel.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent p-space-md text-on-primary">
          <span className="text-headline-sm font-bold">{selectedModel.name} (TwistFit Official)</span>
          <span className="text-body-sm text-inverse-on-surface opacity-90">
            {selectedModel.poseCount} tư thế tự nhiên • {selectedModel.tagline}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-space-xs rounded-2xl bg-surface-container-low p-space-sm">
        <div className="flex flex-col rounded-xl bg-surface-container-lowest p-2">
          <span className="text-label-sm text-outline">Chiều cao chuẩn</span>
          <span className="mt-0.5 text-label-lg font-bold text-on-surface">{selectedModel.height}</span>
          <span className="text-body-sm text-on-surface-variant">Tỷ lệ chân 5:5</span>
        </div>
        <div className="flex flex-col rounded-xl bg-surface-container-lowest p-2">
          <span className="text-label-sm text-outline">Dáng người</span>
          <span className="mt-0.5 text-label-lg font-bold text-on-surface">{selectedModel.bodyShape}</span>
          <span className="text-body-sm text-on-surface-variant">Vòng eo {selectedModel.waist}</span>
        </div>
        <div className="flex flex-col rounded-xl bg-surface-container-lowest p-2">
          <span className="text-label-sm text-outline">Tông da thực tế</span>
          <span className="mt-0.5 text-label-lg font-bold capitalize text-primary">{selectedModel.undertone}</span>
        </div>
        <div className="flex flex-col rounded-xl bg-surface-container-lowest p-2">
          <span className="text-label-sm text-outline">Personal Color</span>
          <span className="mt-0.5 text-label-lg font-bold text-secondary">{selectedModel.personalColor}</span>
        </div>
      </div>
      <div className="flex flex-col gap-space-sm pt-space-xs">
        <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-fixed text-primary">
              <span className="material-symbols-outlined text-[20px]">high_density</span>
            </div>
            <div className="flex flex-col">
              <span className="text-label-md font-semibold text-on-surface">Chế độ chất lượng cao HD</span>
              <span className="text-body-sm text-outline">Chi tiết nếp vải &amp; sợi tơ voan</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isHdOn}
            onChange={(event) => setIsHdOn(event.target.checked)}
            aria-label="Chế độ chất lượng cao HD"
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-secondary-fixed/30 px-space-sm py-2 text-body-sm text-on-secondary-fixed">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
            Thời gian render dự kiến:
          </span>
          <span className="text-label-md font-bold">~15 giây • 1 credit</span>
        </div>
        <p className="text-center text-body-sm leading-tight text-outline">
          TwistFit AI tự động căn chỉnh số đo áo theo tỷ lệ vai và ngực của người mẫu {selectedModel.name}.
        </p>
      </div>
    </div>
  )
}
