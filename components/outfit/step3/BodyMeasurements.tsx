'use client'

import { useState } from 'react'
import { useOutfitFlow } from '../OutfitFlowProvider'

const MEASURE_MIN = 41
const MEASURE_MAX = 149

type MeasureStepperProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

function MeasureStepper({ label, value, onChange }: MeasureStepperProps) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-surface-container-low p-space-sm text-center">
      <span className="text-label-sm text-outline">{label}</span>
      <div className="mt-1 flex w-full items-center justify-between">
        <button
          type="button"
          aria-label={`Giảm ${label}`}
          onClick={() => onChange(Math.max(MEASURE_MIN, value - 1))}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container text-label-md font-bold text-on-surface hover:bg-surface-container-highest"
        >
          -
        </button>
        <span className="text-headline-sm font-bold text-on-surface">{value}</span>
        <button
          type="button"
          aria-label={`Tăng ${label}`}
          onClick={() => onChange(Math.min(MEASURE_MAX, value + 1))}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-container text-label-md font-bold text-on-surface hover:bg-surface-container-highest"
        >
          +
        </button>
      </div>
      <span className="text-label-sm text-outline-variant">cm</span>
    </div>
  )
}

export default function BodyMeasurements() {
  const { selectedModel } = useOutfitFlow()
  const [height, setHeight] = useState(165)
  const [weight, setWeight] = useState(50)
  const [bust, setBust] = useState(84)
  const [waist, setWaist] = useState(62)
  const [hip, setHip] = useState(90)

  const heightLabel = `1m${height - 100}`

  return (
    <div className="sticky top-24 flex flex-col gap-space-lg rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary">straighten</span>
          <h2 className="text-title-md font-semibold text-on-surface">Tùy chỉnh số đo vóc dáng</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setHeight(165)
            setWeight(50)
            setBust(84)
            setWaist(62)
            setHip(90)
          }}
          className="text-label-sm font-semibold text-primary transition-colors hover:text-on-surface-variant"
        >
          Mặc định
        </button>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-container-high p-space-md">
        <div className="flex items-center gap-space-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm">
            <span className="material-symbols-outlined text-[22px]">hourglass_empty</span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-sm uppercase tracking-wider text-outline">AI Phân tích dáng</span>
            <span className="text-headline-sm font-bold text-on-surface">{selectedModel.bodyShape}</span>
          </div>
        </div>
        <span className="rounded-full bg-surface-container-lowest px-2 py-1 text-label-sm font-bold text-secondary">
          98% khớp
        </span>
      </div>
      <div className="flex flex-col gap-space-md rounded-xl bg-surface-container-low p-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant">Chiều cao</span>
            <span className="text-headline-sm font-bold text-primary">{heightLabel}</span>
          </div>
          <input
            type="range"
            min={145}
            max={185}
            value={height}
            aria-label="Chiều cao"
            onChange={(event) => setHeight(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
          />
          <div className="flex justify-between text-label-sm text-outline">
            <span>1m45</span>
            <span>1m65</span>
            <span>1m85</span>
          </div>
        </div>
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="text-label-md text-on-surface-variant">Cân nặng</span>
            <span className="text-headline-sm font-bold text-primary">{weight} kg</span>
          </div>
          <input
            type="range"
            min={40}
            max={80}
            value={weight}
            aria-label="Cân nặng"
            onChange={(event) => setWeight(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container-highest accent-primary"
          />
          <div className="flex justify-between text-label-sm text-outline">
            <span>40 kg</span>
            <span>50 kg</span>
            <span>80 kg</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-space-sm">
        <span className="text-label-md font-semibold uppercase tracking-wider text-on-surface">
          Số đo ba vòng tiêu chuẩn (cm)
        </span>
        <div className="grid grid-cols-3 gap-space-sm">
          <MeasureStepper label="Vòng 1 (Ngực)" value={bust} onChange={setBust} />
          <MeasureStepper label="Vòng 2 (Eo)" value={waist} onChange={setWaist} />
          <MeasureStepper label="Vòng 3 (Mông)" value={hip} onChange={setHip} />
        </div>
      </div>
      <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center justify-between text-label-md">
          <span className="font-medium text-on-surface">Độ tương thích Peplum Fit</span>
          <span className="font-bold text-primary">Rất hoàn hảo (96%)</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div className="h-full w-[96%] rounded-full bg-gradient-to-r from-primary to-secondary" />
        </div>
        <span className="text-body-sm text-on-surface-variant">
          Tỷ lệ thắt eo {waist}cm kết hợp độ xòe peplum giúp tôn trọn dáng {selectedModel.bodyShape.toLowerCase()}.
        </span>
      </div>
    </div>
  )
}
