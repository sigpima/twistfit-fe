'use client'

import { useState } from 'react'

const GARMENT_TYPES = [
  { value: 'top', label: 'Trên (Top / Áo sơ mi)' },
  { value: 'bottom', label: 'Dưới (Bottom / Chân váy / Quần)' },
  { value: 'dress', label: 'Đầm liền (Full Dress)' },
  { value: 'outerwear', label: 'Áo khoác / Blazer (Outerwear)' },
]

const FIT_OPTIONS = [
  { value: 'slim', label: 'Dáng ôm sát (Slim / Bodycon)' },
  { value: 'regular', label: 'Dáng thường (Regular Fit)' },
  { value: 'loose', label: 'Dáng thụng / Xòe (Loose / Peplum)' },
  { value: 'oversize', label: 'Oversize phong cách Hàn' },
]

const PALETTE_SWATCHES = [
  { hex: '#fbd7e4', title: 'Blush Pink' },
  { hex: '#d0e1fd', title: 'Icy Pastel Blue' },
  { hex: '#e6ddf5', title: 'Soft Lilac' },
  { hex: '#ffffff', title: 'Pure Ivory' },
  { hex: '#4a5a80', title: 'Navy Contrast' },
]

export default function ColorHarmonyCard() {
  const [garmentType, setGarmentType] = useState('top')
  const [fit, setFit] = useState('regular')

  return (
    <div className="relative flex flex-col gap-space-md overflow-hidden rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[22px] text-secondary">auto_fix_high</span>
          <h2 className="text-headline-sm font-semibold text-on-surface">Đánh Giá Hòa Sắc AI</h2>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-label-sm font-bold tracking-wide text-on-secondary">
          Match 98%
        </span>
      </div>
      <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-md">
        <div className="flex items-center justify-between">
          <span className="text-label-md font-medium text-on-surface-variant">Bảng màu phù hợp nhất:</span>
          <span className="text-label-lg font-bold text-primary">Light Summer & Cool Winter</span>
        </div>
        <div className="flex items-center gap-space-xs pt-1">
          {PALETTE_SWATCHES.map((swatch) => (
            <div
              key={swatch.hex}
              title={swatch.title}
              className="h-7 w-7 rounded-full shadow-sm"
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
        <div className="mt-space-xs flex flex-col gap-1">
          <div className="flex justify-between text-label-sm text-on-surface-variant">
            <span>Độ tôn sắc da (Skin undertone match)</span>
            <span className="font-bold text-secondary">Rất Cao</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-2 w-[98%] rounded-full bg-gradient-to-r from-primary to-secondary" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-space-sm">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="garment-type"
            className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant"
          >
            Phân loại áo/quần
          </label>
          <select
            id="garment-type"
            value={garmentType}
            onChange={(event) => setGarmentType(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl bg-surface-container-low px-space-sm py-2 text-label-md text-on-surface focus:outline-none"
          >
            {GARMENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="garment-fit"
            className="text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant"
          >
            Độ ôm phom (Fit)
          </label>
          <select
            id="garment-fit"
            value={fit}
            onChange={(event) => setFit(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl bg-surface-container-low px-space-sm py-2 text-label-md text-on-surface focus:outline-none"
          >
            {FIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
