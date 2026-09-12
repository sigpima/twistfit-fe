'use client'

import { useOutfitFlow, DEFAULT_GARMENT, type Garment } from '../OutfitFlowProvider'

const RECENT_GARMENTS: { shortLabel: string; garment: Garment }[] = [
  { shortLabel: 'Áo peplum hồng', garment: DEFAULT_GARMENT },
  {
    shortLabel: 'Đầm xanh satin',
    garment: {
      id: 'dress-blue',
      name: 'Đầm Lụa Satin Xanh Cerulean',
      image: '/outfit/garment-dress-blue.jpg',
      thumbnail: '/outfit/garment-dress-blue.jpg',
      matchScore: '94%',
      tone: 'Cool Winter',
      type: 'Dress',
    },
  },
  {
    shortLabel: 'Blazer lửng đen',
    garment: {
      id: 'blazer-black',
      name: 'Blazer Cắt Cúp Đen Tối Giản',
      image: '/outfit/garment-blazer-black.jpg',
      thumbnail: '/outfit/garment-blazer-black.jpg',
      matchScore: '91%',
      tone: 'Deep Winter',
      type: 'Outerwear',
    },
  },
  {
    shortLabel: 'Váy xếp ly kem',
    garment: {
      id: 'skirt-cream',
      name: 'Chân Váy Xòe Xếp Ly Màu Be Sữa',
      image: '/outfit/garment-skirt-cream.jpg',
      thumbnail: '/outfit/garment-skirt-cream.jpg',
      matchScore: '86%',
      tone: 'Soft Autumn',
      type: 'Bottom',
    },
  },
]

export default function RecentGarments() {
  const { selectedGarment, setSelectedGarment } = useOutfitFlow()

  return (
    <div className="flex flex-col gap-space-md rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[20px] text-primary">history</span>
          <h2 className="text-headline-sm font-semibold text-on-surface">Mục Gần Đây Đã Thử</h2>
        </div>
        <a href="#" className="text-label-md font-medium text-primary hover:underline">
          Xem tủ đồ ➔
        </a>
      </div>
      <div className="grid grid-cols-4 gap-space-sm">
        {RECENT_GARMENTS.map(({ shortLabel, garment }) => {
          const isSelected = selectedGarment.id === garment.id
          return (
            <button
              key={garment.id}
              type="button"
              onClick={() => setSelectedGarment(garment)}
              className={`group relative flex flex-col items-center rounded-2xl p-2 text-left transition-all ${
                isSelected
                  ? 'bg-surface-container-high ring-2 ring-primary'
                  : 'bg-surface-container-low hover:bg-surface-container'
              }`}
            >
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={garment.thumbnail}
                  alt={garment.name}
                  className="h-full object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <span className="mt-1.5 w-full truncate text-center text-label-sm font-medium text-on-surface">
                {shortLabel}
              </span>
              {isSelected && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
