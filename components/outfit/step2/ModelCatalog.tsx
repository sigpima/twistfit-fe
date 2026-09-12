'use client'

import { useState, type ChangeEvent } from 'react'
import { useOutfitFlow, DEFAULT_MODEL, type Model, type Undertone } from '../OutfitFlowProvider'

const MODELS: Model[] = [
  DEFAULT_MODEL,
  {
    id: 'aisha',
    name: 'Aisha',
    image: '/outfit/models/aisha.jpg',
    dossierImage: '/outfit/models/aisha.jpg',
    poseCount: 15,
    tagline: 'Da ngăm • Warm Deep',
    undertone: 'warm',
    height: '1m70',
    bodyShape: 'Đồng hồ cát',
    waist: '66cm',
    personalColor: 'Warm Deep Autumn',
  },
  {
    id: 'alice',
    name: 'Alice',
    image: '/outfit/models/alice.jpg',
    dossierImage: '/outfit/models/alice.jpg',
    poseCount: 15,
    tagline: 'Da sáng • Cool Summer',
    undertone: 'cool',
    height: '1m68',
    bodyShape: 'Dáng thước kẻ',
    waist: '62cm',
    personalColor: 'Cool Summer Light',
  },
  {
    id: 'amara',
    name: 'Amara',
    image: '/outfit/models/amara.jpg',
    dossierImage: '/outfit/models/amara.jpg',
    poseCount: 15,
    tagline: 'Afro Chic • Tôn đồ màu',
    undertone: 'warm',
    height: '1m72',
    bodyShape: 'Đồng hồ cát',
    waist: '68cm',
    personalColor: 'Warm Spring Bright',
  },
  {
    id: 'arjun',
    name: 'Arjun',
    image: '/outfit/models/arjun.jpg',
    dossierImage: '/outfit/models/arjun.jpg',
    poseCount: 12,
    tagline: 'Mẫu nam • Form Unisex',
    undertone: 'neutral',
    height: '1m80',
    bodyShape: 'Chữ nhật',
    waist: '80cm',
    personalColor: 'Neutral Autumn',
  },
  {
    id: 'astrid',
    name: 'Astrid',
    image: '/outfit/models/astrid.jpg',
    dossierImage: '/outfit/models/astrid.jpg',
    poseCount: 15,
    tagline: 'Tây Âu • Dáng thanh mảnh',
    undertone: 'cool',
    height: '1m75',
    bodyShape: 'Dáng thước kẻ',
    waist: '60cm',
    personalColor: 'Cool Winter Bright',
  },
  {
    id: 'chloe',
    name: 'Chloe',
    image: '/outfit/models/chloe.jpg',
    dossierImage: '/outfit/models/chloe.jpg',
    poseCount: 15,
    tagline: 'Á Đông • Dáng Petite',
    undertone: 'neutral',
    height: '1m58',
    bodyShape: 'Petite',
    waist: '58cm',
    personalColor: 'Neutral Spring',
  },
  {
    id: 'bella',
    name: 'Bella',
    image: '/outfit/models/bella.jpg',
    dossierImage: '/outfit/models/bella.jpg',
    poseCount: 15,
    tagline: 'Đồng hồ cát • Đầy đặn',
    undertone: 'warm',
    height: '1m67',
    bodyShape: 'Đồng hồ cát',
    waist: '70cm',
    personalColor: 'Warm Autumn Deep',
  },
  {
    id: 'camille',
    name: 'Camille',
    image: '/outfit/models/camille.jpg',
    dossierImage: '/outfit/models/camille.jpg',
    poseCount: 15,
    tagline: 'Parisian Chic • Dáng Quả Lê',
    undertone: 'neutral',
    height: '1m66',
    bodyShape: 'Quả lê',
    waist: '65cm',
    personalColor: 'Neutral Summer',
  },
  {
    id: 'dave',
    name: 'Dave',
    image: '/outfit/models/dave.jpg',
    dossierImage: '/outfit/models/dave.jpg',
    poseCount: 10,
    tagline: 'Mẫu nam • Dáng thể thao',
    undertone: 'warm',
    height: '1m82',
    bodyShape: 'Thể thao',
    waist: '82cm',
    personalColor: 'Warm Spring',
  },
  {
    id: 'linh-dan',
    name: 'Linh Đan',
    image: '/outfit/models/linh-dan.jpg',
    dossierImage: '/outfit/models/linh-dan.jpg',
    poseCount: 15,
    tagline: 'Thuần Việt • Da trắng hồng',
    undertone: 'cool',
    height: '1m62',
    bodyShape: 'Đồng hồ cát',
    waist: '60cm',
    personalColor: 'Cool Summer Soft',
  },
  {
    id: 'kenji',
    name: 'Kenji',
    image: '/outfit/models/kenji.jpg',
    dossierImage: '/outfit/models/kenji.jpg',
    poseCount: 12,
    tagline: 'Tokyo Street • Tối giản',
    undertone: 'cool',
    height: '1m75',
    bodyShape: 'Chữ nhật',
    waist: '76cm',
    personalColor: 'Cool Winter Deep',
  },
]

const UNDERTONE_FILTERS: { id: 'all' | Undertone; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'warm', label: 'Warm' },
  { id: 'cool', label: 'Cool' },
  { id: 'neutral', label: 'Neutral' },
]

export default function ModelCatalog() {
  const { selectedModel, setSelectedModel } = useOutfitFlow()
  const [undertoneFilter, setUndertoneFilter] = useState<'all' | Undertone>('all')

  const visibleModels = MODELS.filter(
    (model) => undertoneFilter === 'all' || model.undertone === undertoneFilter
  )

  function handleCustomUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const imageUrl = URL.createObjectURL(file)
    setSelectedModel({
      id: 'custom-upload',
      name: 'Ảnh của bạn',
      image: imageUrl,
      dossierImage: imageUrl,
      poseCount: 1,
      tagline: 'Ảnh cá nhân tự tải lên',
      undertone: 'neutral',
      height: '—',
      bodyShape: '—',
      waist: '—',
      personalColor: '—',
    })
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <span className="flex items-center gap-space-xs text-label-lg font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
            Bộ lọc đặc tính cơ thể
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-label-sm font-medium text-on-surface-variant">Tông da (Undertone)</label>
          <div className="flex items-center gap-1.5 rounded-xl bg-surface-container-low p-1">
            {UNDERTONE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setUndertoneFilter(filter.id)}
                className={`flex-1 rounded-lg py-1.5 text-center text-label-sm ${
                  undertoneFilter === filter.id
                    ? 'bg-surface-container-lowest font-semibold text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <span className="text-label-lg font-semibold text-on-surface">
            Danh sách AI Model thế hệ mới ({MODELS.length} lựa chọn)
          </span>
          <span className="text-body-sm text-outline">Click vào ảnh để đổi người mẫu</span>
        </div>
        <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3 md:grid-cols-4">
          <label
            htmlFor="modelUploadInput"
            className="group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl bg-surface-container-high/60 p-space-md text-center shadow-xs transition-all hover:bg-secondary-fixed/30 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-lowest text-primary shadow-sm transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary">
              <span className="material-symbols-outlined text-[26px]">add</span>
            </div>
            <span className="mt-space-sm font-semibold text-label-lg text-on-surface">Tải ảnh mặt / dáng</span>
            <p className="mt-1 px-1 text-body-sm text-outline">Chụp thẳng hoặc tải từ thư viện ảnh</p>
            <span className="mt-2 rounded-full bg-surface-container-lowest px-2 py-0.5 text-label-sm text-secondary">
              Tuỳ biến 100%
            </span>
          </label>
          <input
            id="modelUploadInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomUpload}
          />
          {visibleModels.map((model) => {
            const isSelected = selectedModel.id === model.id
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => setSelectedModel(model)}
                className={`relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest text-left shadow-sm transition-all hover:shadow-md ${
                  isSelected ? 'bg-gradient-to-b from-primary/5 to-secondary/10 shadow-lg' : ''
                }`}
              >
                {isSelected && (
                  <>
                    <div className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary shadow-md">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <div className="absolute left-2 top-2 z-10 rounded-full bg-surface-container-lowest/90 px-2 py-0.5 text-label-sm font-bold text-primary shadow-xs backdrop-blur-md">
                      Đang chọn
                    </div>
                  </>
                )}
                <div className="aspect-[3/4] w-full overflow-hidden bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={model.image}
                    alt={model.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="flex flex-col bg-surface-container-lowest p-space-sm">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-label-lg font-semibold ${isSelected ? 'font-bold text-primary' : 'text-on-surface'}`}
                    >
                      {model.name}
                    </span>
                    <span className={`text-label-sm ${isSelected ? 'font-semibold text-primary' : 'text-outline'}`}>
                      {model.poseCount} dáng
                    </span>
                  </div>
                  <span className="mt-0.5 text-body-sm text-on-surface-variant">{model.tagline}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
