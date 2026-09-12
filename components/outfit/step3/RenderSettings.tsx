'use client'

import { useState } from 'react'

export default function RenderSettings() {
  const [isHdOn, setIsHdOn] = useState(true)
  const [isPhysicsOn, setIsPhysicsOn] = useState(true)

  return (
    <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center gap-space-xs">
        <span className="material-symbols-outlined text-primary">auto_fix_high</span>
        <h3 className="text-title-md font-semibold text-on-surface">Cài đặt render chuyên sâu</h3>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
            <span className="material-symbols-outlined text-[20px]">hd</span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-lg font-semibold text-on-surface">Chế độ chất lượng cao HD 4K</span>
            <span className="text-body-sm text-on-surface-variant">Mô phỏng chân thực vân vải đũi &amp; lụa cao cấp</span>
          </div>
        </div>
        <input
          type="checkbox"
          checked={isHdOn}
          onChange={(event) => setIsHdOn(event.target.checked)}
          aria-label="Chế độ chất lượng cao HD 4K"
        />
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-on-secondary-fixed">
            <span className="material-symbols-outlined text-[20px]">waves</span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-lg font-semibold text-on-surface">
              Mô phỏng chuyển động vải Smart Fit Physics
            </span>
            <span className="text-body-sm text-on-surface-variant">
              Tạo độ rủ peplum tự nhiên và các nếp gấp chân thật
            </span>
          </div>
        </div>
        <input
          type="checkbox"
          checked={isPhysicsOn}
          onChange={(event) => setIsPhysicsOn(event.target.checked)}
          aria-label="Mô phỏng chuyển động vải Smart Fit Physics"
        />
      </div>
    </div>
  )
}
